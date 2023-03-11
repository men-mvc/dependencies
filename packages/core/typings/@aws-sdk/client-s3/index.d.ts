declare module '@aws-sdk/client-s3' {
  import { Readable } from 'stream';
  import { ReadableStream } from 'stream/web';

  export declare interface GetObjectCommandOutput {
    Body?:
      | Readable
      | ReadableStream
      | (Blob & {
          transformToByteArray: () => Promise<Uint8Array>;
        });
  }

  export declare interface PutObjectCommandOutput {
    Body: Readable | ReadableStream | Blob | string | Uint8Array | Buffer;
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
  }

  export declare class S3Client {
    constructor(config: {
      region?: string;
      credentials: {
        accessKeyId: string;
        secretAccessKey: string;
      };
    }) {}

    // TODO: figure out how to return right type based on the argument
    public send: (
      command:
        | PutObjectCommand
        | DeleteObjectsCommandInput
        | GetObjectCommand
        | ListObjectsV2Command
    ) => Promise<
      | PutObjectCommandOutput
      | HeadObjectCommandOutput
      | GetObjectCommandOutput
      | ListObjectsV2CommandOutput
    >;
  }

  export declare class PutObjectCommand {
    constructor(params: {
      Bucket: string;
      Key: string;
      Body: string | NodeJS.ArrayBufferView;
    }) {}
  }

  export declare class DeleteObjectCommand {
    constructor(params: { Bucket: string; Key: string }) {}
  }

  export declare class HeadObjectCommand {
    constructor(params: { Bucket: string; Key: string }) {}
  }

  export declare class CopyObjectCommand {
    constructor(params: { CopySource: string; Bucket: string; Key: string }) {}
  }

  export declare interface HeadObjectCommandOutput {
    $metadata: string;
    ETag: string;
    VersionId: string;
  }

  export declare class ListObjectsV2Command {
    constructor(params: { Bucket: string; Prefix?: string }) {}
  }

  export declare interface ListObjectsV2CommandOutput {
    IsTruncated: boolean;
    Contents: {
      Key: string;
    }[];
  }

  export declare class GetObjectCommand {
    constructor(params: { Bucket: string; Key: string }) {}
  }

  export declare interface DeleteObjectsCommandInput {
    Bucket: string;
    Delete: {
      Objects: {
        Key: string;
      }[];
    };
  }

  export declare class DeleteObjectsCommand {
    constructor(params: DeleteObjectsCommandInput) {}
  }
}
