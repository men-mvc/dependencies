declare module '@men-mvc/adapter' {
  import { ReadStream } from 'fs';

  export declare type MenS3PutObjectCommandOutput = {
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

  export declare class MenS3Adapter {
    public createReadStream: (key: string) => Promise<ReadStream>;
    public copy: (fromKey: string, toKey: string) => Promise<void>;
    public rename: (fromKey: string, toKey: string) => Promise<void>;
    public writeFile: (
      key: string, // for s3 this will be the key
      data: string | NodeJS.ArrayBufferView // content is the content for the S3
    ) => Promise<MenS3PutObjectCommandOutput>;
    public deleteFile: (key: string) => Promise<void>;
    public deleteFiles: (pathsOrKeys: string[]) => Promise<void>;
    public exists: (pathOrKey: string) => Promise<boolean>;
    public readDir: (keyPrefix: string) => Promise<string[]>;
    public mkdir: (path: string) => Promise<void>;
    public rmdir: (path: string, forceDelete?: boolean) => Promise<void>;
    public readFile: (key: string) => Promise<Buffer>;
    public isFile: (key: string) => Promise<boolean>;
    public isDir: (pathOrKey: string) => Promise<boolean>;
  }
}
