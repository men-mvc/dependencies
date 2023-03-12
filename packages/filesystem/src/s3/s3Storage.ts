import { ReadStream, WriteFileOptions } from 'fs';
import { ReadStreamOptions, Storage, WriteFileResult } from '../types';

type MenS3PutObjectCommandOutput = {
  $metadata: {
    httpStatusCode: number;
    requestId: string;
    cfId?: string;
    attempts: number;
    totalRetryDelay: number;
  };
  ETag: string;
  ServerSideEncryption: string;
  VersionId: string;
};

declare class MenS3Adapter {
  public createReadStream: (key: string) => Promise<ReadStream>;
  public copy: (fromKey: string, toKey: string) => Promise<void>;
  public rename: (fromKey: string, toKey: string) => Promise<void>
  public writeFile: (
      key: string, // for s3 this will be the key
      data: string | NodeJS.ArrayBufferView // content is the content for the S3
  ) => Promise<MenS3PutObjectCommandOutput>;
  public deleteFile: (key: string) => Promise<void>;
  public deleteFiles: (pathsOrKeys: string[]) => Promise<void>;
  public exists:(pathOrKey: string) => Promise<boolean>;
  public readDir:(keyPrefix: string) => Promise<string[]>;
  public mkdir: (path: string) => Promise<void>;
  public rmdir: (path: string, forceDelete?: boolean) => Promise<void>;
  public readFile: (key: string) => Promise<Buffer>;
  public isFile: (key: string) => Promise<boolean>;
  public isDir: (pathOrKey: string) => Promise<boolean>;
}

// referene link -> https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html?fbclid=IwAR0gIsyNLqKN0wJd1-C4RG0izXxFy0u8fjU3FyE9exJ_Swfji6eEIWgzegg
// TODO: unit test.
// TODO: test for storeFile and storeFiles
export class S3Storage implements Storage {
  private adapter: MenS3Adapter | undefined;

  private getS3Adapter = (): MenS3Adapter => {
    try {
      if (this.adapter) {
        return this.adapter;
      }
      const s3Adapter = require(`@men-mvc/s3-adapter`)
      this.adapter = new s3Adapter.MenS3Adapter() as MenS3Adapter;

      return this.adapter;
    } catch (e) {
      throw e;
    }
  }

  public createReadStream = async (
    key: string,
    options?: ReadStreamOptions
  ): Promise<ReadStream> => {
    if (options) {
      console.warn(
        'createReadStream does not support second argument (options) for the S3 driver.'
      );
    }

    return this.getS3Adapter().createReadStream(key);
  };

  public copy = async (fromKey: string, toKey: string): Promise<void> =>
      this.getS3Adapter().copy(fromKey, toKey);

  public rename = async (fromKey: string, toKey: string): Promise<void> =>
      this.getS3Adapter().rename(fromKey, toKey);

  public writeFile = async (
    key: string, // for s3 this will be the key
    data: string | NodeJS.ArrayBufferView, // content is the content for the S3
    options?: WriteFileOptions // What about this? - not available for S3
  ): Promise<WriteFileResult> => {
    if (options) {
      console.warn(
        'options argument of writeFile function is not supported for S3 filesystem.'
      );
    }

    const result = await this.getS3Adapter().writeFile(key, data);

    return {
      ...result,
      filepath: key,
    }
  };

  public deleteFile = async (key: string): Promise<void> =>
      this.getS3Adapter().deleteFile(key);

  public deleteFiles = async (pathsOrKeys: string[]): Promise<void> =>
      this.getS3Adapter().deleteFiles(pathsOrKeys);

  public exists = async (pathOrKey: string): Promise<boolean> =>
      this.getS3Adapter().exists(pathOrKey);

  public readDir = async (keyPrefix: string): Promise<string[]> =>
      this.getS3Adapter().readDir(keyPrefix);

  public mkdir = async (path: string): Promise<void> =>
      this.getS3Adapter().mkdir(path);

  public rmdir = async (path: string, forceDelete?: boolean): Promise<void> =>
      this.getS3Adapter().rmdir(path, forceDelete);

  public readFile = async (key: string): Promise<Buffer> =>
      this.getS3Adapter().readFile(key);

  public isFile = async (key: string): Promise<boolean> =>
      this.getS3Adapter().isFile(key);

  public isDir = async (pathOrKey: string): Promise<boolean> =>
      this.getS3Adapter().isDir(pathOrKey);
}
