import { ReadStream } from 'fs';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  HeadObjectCommandOutput,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectsCommandInput,
  DeleteObjectsCommand
} from '@aws-sdk/client-s3';
import { getMimeType } from '@men-mvc/foundation';
import {
  getAwsS3Bucket,
  getAwsS3Credentials,
  getCloudFrontConfig,
  getCloudFrontDomain,
  getMaxRetryAttempts,
  getRetryMode,
  getSignedUrlExpireTime
} from './utilities';
import { AwsCloudfrontSign, MenS3PutObjectCommandOutput } from './types';

// referene link -> https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html?fbclid=IwAR0gIsyNLqKN0wJd1-C4RG0izXxFy0u8fjU3FyE9exJ_Swfji6eEIWgzegg
export class MenS3Adapter {
  private s3Client: S3Client | undefined;
  private signClient: AwsCloudfrontSign | undefined;

  // TODO: unit test
  public getS3ClientConfig = () => {
    const bucketConfig = getAwsS3Credentials();

    return {
      retryMode: getRetryMode(),
      maxAttempts: getMaxRetryAttempts(),
      region: bucketConfig.region,
      credentials: {
        accessKeyId: bucketConfig.accessKeyId,
        secretAccessKey: bucketConfig.secretAccessKey
      }
    };
  };

  public getS3Client = (): S3Client => {
    if (this.s3Client) {
      return this.s3Client;
    }

    this.s3Client = new S3Client(this.getS3ClientConfig());

    return this.s3Client;
  };

  public getCloudFrontDomain = (): string => getCloudFrontDomain();

  public getCloudFrontSignClient = (): AwsCloudfrontSign => {
    try {
      if (this.signClient) {
        return this.signClient;
      }

      this.signClient = require(`aws-cloudfront-sign`) as AwsCloudfrontSign;

      return this.signClient;
    } catch (e) {
      throw e;
    }
  };

  public getSignedUrl = (key: string, durationInSeconds?: number): string => {
    const config = getCloudFrontConfig();

    return this.getCloudFrontSignClient().getSignedUrl(
      `${config.domainName}/${key}`,
      {
        keypairId: config.publicKeyId,
        privateKeyString: config.privateKeyString,
        expireTime: getSignedUrlExpireTime(durationInSeconds)
      }
    );
  };

  public createReadStream = async (key: string): Promise<ReadStream> => {
    const command = new GetObjectCommand({
      Bucket: getAwsS3Bucket(),
      Key: key
    });

    const response = await this.getS3Client().send(command);
    if (!response.Body) {
      throw new Error('Unable to read the content of the S3 object.');
    }

    return response.Body as unknown as ReadStream;
  };

  public copy = async (fromKey: string, toKey: string): Promise<void> => {
    const command = new CopyObjectCommand({
      CopySource: `${getAwsS3Bucket()}/${fromKey}`,
      Bucket: getAwsS3Bucket(),
      Key: toKey
    });

    await this.getS3Client().send(command);
  };

  /**
   * For S3, renaming the folder with files will throw error (object with provided key does not exist)
   * for S3, renaming should be only done on the files/ objects
   */
  public rename = async (fromKey: string, toKey: string): Promise<void> => {
    await this.copy(fromKey, toKey);
    await this.deleteFile(fromKey);
  };

  public writeFile = async (
    key: string, // for s3 this will be the key
    data: string | NodeJS.ArrayBufferView // content is the content for the S3
  ): Promise<MenS3PutObjectCommandOutput> => {
    const command = new PutObjectCommand({
      Bucket: getAwsS3Bucket(),
      Key: key,
      ContentType: getMimeType(key) ?? undefined,
      Body: data
    });

    return (await this.getS3Client().send(
      command
    )) as MenS3PutObjectCommandOutput;
  };

  public deleteFile = async (key: string): Promise<void> => {
    const command = new DeleteObjectCommand({
      Bucket: getAwsS3Bucket(),
      Key: key
    });

    await this.getS3Client().send(command);
  };

  public deleteFiles = async (pathsOrKeys: string[]): Promise<void> => {
    const command = new DeleteObjectsCommand({
      Bucket: getAwsS3Bucket(),
      Delete: {
        Objects: pathsOrKeys.map((key) => ({ Key: key }))
      }
    });

    await this.getS3Client().send(command);
  };

  /**
   * if the directory has objects and if you pass directory-name/, it will return false
   * works for both file and directory
   */
  public exists = async (pathOrKey: string): Promise<boolean> => {
    try {
      await this.readHeadObject(pathOrKey);

      return true;
    } catch (e) {
      if (e instanceof Error && e.name === 'NotFound') {
        return false;
      }

      throw e;
    }
  };

  public readDir = async (keyPrefix: string): Promise<string[]> => {
    const command = new ListObjectsV2Command({
      Bucket: getAwsS3Bucket(),
      Prefix: !keyPrefix || keyPrefix === '/' ? undefined : keyPrefix
    });

    const response = await this.getS3Client().send(command);
    if (!response.Contents?.length) {
      return [];
    }

    return response.Contents.map((c) => c.Key).filter(
      (key) => !!key
    ) as string[];
  };

  public mkdir = async (path: string): Promise<void> => {
    if (!path.endsWith('/')) {
      path = `${path}/`;
    }
    await this.writeFile(path, '');
  };

  public rmdir = async (path: string, forceDelete?: boolean): Promise<void> => {
    if (!path.endsWith('/')) {
      path = `${path}/`;
    }
    if (forceDelete) {
      await this.rmDirRecursively(path);
    } else {
      // when there are objects in the bucket, it will not delete but it still does not throw error
      await this.deleteFile(path);
    }
  };

  public readFile = async (key: string): Promise<Buffer> => {
    const command = new GetObjectCommand({
      Bucket: getAwsS3Bucket(),
      Key: key
    });

    const response = await this.getS3Client().send(command);

    if (!response.Body) {
      throw new Error(`Unable to read the content of the object.`);
    }

    const byteArray: Uint8Array | undefined = await (
      response.Body as {
        transformToByteArray: () => Promise<Uint8Array>;
      }
    ).transformToByteArray();
    if (!byteArray) {
      throw new Error(`Unable to read the content of the object.`);
    }

    return Buffer.from(byteArray);
  };

  /**
   * it tries to read header
   * when it can read the header and if the key ends with "/", it is considered as folder and return false
   * when it can read the header and if the key does not end with "/", it is considered as file
   * when it throws error because it cannot read header
   * if the error is not found, it will try to add trailing "/" and read header again to check if it is folder and return false
   * otherwise, it will throw the error
   */
  public isFile = async (key: string): Promise<boolean> => {
    try {
      await this.readHeadObject(key);

      return !key.endsWith('/');
    } catch (e) {
      if (e instanceof Error) {
        if (e.name !== 'NotFound') {
          throw e;
        }
        if (!key.endsWith('/')) {
          // check if it is folder/ directory
          try {
            await this.readHeadObject(`${key}/`);

            return false;
          } catch (readHeaderError) {
            throw readHeaderError;
          }
        }
      }
      throw e;
    }
  };

  /**
   * check if the key ends with "/". If not, add trailing "/"
   * if it can read header data of the object when key has trailing "/", it is considered as folder
   * it will throw error when the object matching the key does not exist
   * if the error code is NotFound, it will check if it is file removing trailing "/" to return false. (otherwise, it throws error)
   */
  public isDir = async (pathOrKey: string): Promise<boolean> => {
    try {
      let key = pathOrKey.endsWith('/') ? pathOrKey : `${pathOrKey}/`;
      await this.readHeadObject(key);

      return true;
    } catch (e) {
      if (e instanceof Error) {
        if (e.name !== 'NotFound') {
          throw e;
        }
        let key = pathOrKey.endsWith('/') ? pathOrKey.slice(0, -1) : pathOrKey;
        try {
          if (await this.readHeadObject(key)) {
            return false;
          }
        } catch (readHeaderError) {
          throw readHeaderError;
        }
      }
      throw e;
    }
  };

  private rmDirRecursively = async (prefix: string): Promise<void> => {
    const listCommand = new ListObjectsV2Command({
      Bucket: getAwsS3Bucket(),
      Prefix: prefix
    });

    const listResult = await this.getS3Client().send(listCommand);
    if (!listResult.Contents?.length) {
      return;
    }

    const deleteParams: DeleteObjectsCommandInput = {
      Bucket: getAwsS3Bucket(),
      Delete: {
        Objects: []
      }
    };

    for (const content of listResult.Contents) {
      deleteParams.Delete?.Objects?.push({
        Key: content.Key
      });
    }

    const deleteCommand = new DeleteObjectsCommand(deleteParams);
    await this.getS3Client().send(deleteCommand);

    if (listResult.IsTruncated) {
      await this.rmDirRecursively(prefix);
    }
  };

  private readHeadObject = async (
    key: string
  ): Promise<HeadObjectCommandOutput> => {
    const command = new HeadObjectCommand({
      Bucket: getAwsS3Bucket(),
      Key: key
    });

    return this.getS3Client().send(command);
  };
}
