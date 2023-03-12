import { Request } from 'express';
import { DeepPartial, ErrorCodes } from '@men-mvc/globals';
import { WriteFileOptions, ReadStream } from 'fs';
import { MenS3PutObjectCommandOutput } from './s3/types';

export interface Storage {
  readDir: (dir: string) => Promise<string[]>;

  readFile: (
    filepath: string,
    options?: {
      encoding: BufferEncoding;
      flag?: string | undefined;
    }
  ) => Promise<Buffer>;

  createReadStream: (
    filepath: string,
    options: ReadStreamOptions
  ) => Promise<ReadStream>;

  writeFile: (
    pathOrKey: string,
    data: string | NodeJS.ArrayBufferView,
    options?: WriteFileOptions
  ) => Promise<WriteFileResult>;

  deleteFile: (pathOrKey: string) => Promise<void>;

  // TODO:
  deleteFiles: (pathsOrKeys: string[]) => Promise<void>;

  rename: (from: string, to: string) => Promise<void>;

  copy: (from: string, to: string) => Promise<void>;

  exists: (pathOrKey: string) => Promise<boolean>;

  // TODO: test it creates recursively.
  mkdir: (path: string) => Promise<void>;

  rmdir: (path: string, forceDelete?: boolean) => Promise<void>;

  isDir: (path: string) => Promise<boolean>;

  isFile: (dirOrFilepath: string) => Promise<boolean>;
}

export interface BaseFileUploader {
  parseFormData: <T>(request: Request) => Promise<DeepPartial<T>>;

  storeFile: (params: StoreFileParams) => Promise<string>;

  storeFiles: (params: StoreFilesParams) => Promise<string[]>;

  getTempUploadDirectory: () => string;

  clearTempUploadDirectory: () => Promise<void>;
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

export class UploadedFile {
  public originalFilename: string;
  public mimetype!: string;
  public filepath!: string;
  public size!: number;
  public hash?: string | null;
  constructor(args: {
    originalFilename: string;
    mimetype: string;
    filepath: string;
    size: number;
    hash?: string | null;
  }) {
    this.originalFilename = args.originalFilename;
    this.mimetype = args.mimetype;
    this.filepath = args.filepath;
    this.size = args.size;
    this.hash = args.hash;
  }
}

export class UploadMaxFileSizeException extends Error {
  public message: string = `Payload is too large.`;
  constructor() {
    super(`Payload is too large.`);
    this.name = ErrorCodes.UPLOAD_MAX_FILESIZE_LIMIT;
  }
}

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
  filepath: string;
} & Partial<MenS3PutObjectCommandOutput>;
