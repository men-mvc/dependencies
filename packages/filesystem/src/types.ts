import { Request } from 'express';
import { DeepPartial, ErrorCodes, UploadedFile } from '@men-mvc/foundation';
import { WriteFileOptions, ReadStream } from 'fs';

export interface Storage {
  readDir: (dir: string) => Promise<string[]>;

  getAbsolutePath: (path: string) => string;

  readFile: (
    filepath: string,
    options?: {
      encoding: BufferEncoding;
      flag?: string | undefined;
    }
  ) => Promise<Buffer>;

  createReadStream: (
    filepath: string,
    options?: ReadStreamOptions
  ) => Promise<ReadStream>;

  writeFile: (
    pathOrKey: string,
    data: string | NodeJS.ArrayBufferView,
    options?: WriteFileOptions
  ) => Promise<WriteFileResult>;

  writeFilePublicly: (
    pathOrKey: string,
    data: string | NodeJS.ArrayBufferView,
    options?: WriteFileOptions
  ) => Promise<WriteFileResult>;

  deleteFile: (pathOrKey: string) => Promise<void>;

  deleteFiles: (pathsOrKeys: string[]) => Promise<void>;

  rename: (from: string, to: string) => Promise<void>;

  copy: (from: string, to: string) => Promise<void>;

  exists: (pathOrKey: string) => Promise<boolean>;

  mkdir: (path: string) => Promise<string>;

  mkdirPrivate: (path: string) => Promise<string>;

  mkdirPublic: (path: string) => Promise<string>;

  rmdir: (path: string, forceDelete?: boolean) => Promise<void>;

  isDir: (path: string) => Promise<boolean>;

  isFile: (dirOrFilepath: string) => Promise<boolean>;
}

export interface BaseFileUploader {
  parseFormData: <T>(request: Request) => Promise<DeepPartial<T>>;

  storeFile: (params: StoreFileParams) => Promise<string>;

  storeFilePublicly: (params: StoreFileParams) => Promise<string>;

  storeFiles: (params: StoreFilesParams) => Promise<string[]>;

  getAbsoluteTempUploadDirPath: () => string;

  clearTempUploadDirectory: () => Promise<void>;

  resetTempUploadDirId: () => void;
}

export interface BaseFileSystem extends Storage, BaseFileUploader {}

export type StoreFileParams = {
  uploadedFile: UploadedFile;
  directory?: string;
  filename?: string;
};

export type StoreFilesParams = {
  uploadedFiles: UploadedFile[];
  directory?: string;
};

export class InvalidPayloadFormatException extends Error {
  public message: string;

  constructor() {
    super(`Payload format is invalid.`);
    this.message = `Payload format is invalid.`;
    this.name = ErrorCodes.INVALID_PAYLOAD_FORMAT;
  }
}

export type ReadStreamOptions = {
  encoding: BufferEncoding;
  highWaterMark: number;
};

export type WriteFileResult = {
  pathInStorage: string;
  absoluteFilepath: string;
} & Partial<MenS3PutObjectCommandOutput>;

export type MenS3PutObjectCommandOutput = {
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
  public getSignedUrl: (key: string, expireTime?: number) => string;
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

export type LocalUrlSignerClient = {
  sign: (
    url: string,
    options: {
      method: string;
      ttl: number;
    }
  ) => string;

  verify: (
    signedUrl: string,
    options: {
      method: string;
    }
  ) => boolean;
};

export interface MultipartRequest<T> extends Request {
  parsedFormData?: T;
}
