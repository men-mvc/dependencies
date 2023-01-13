import { Request } from 'express';
import { WriteFileOptions, ReadStream } from 'fs';
import { DeepPartial, ErrorCodes } from '../types';

export interface IStorage {
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
    path: string,
    data: string | NodeJS.ArrayBufferView,
    options?: WriteFileOptions
  ) => Promise<void>;

  deleteFile: (path: string) => Promise<void>;

  rename: (from: string, to: string) => Promise<void>;

  exits: (path: string) => Promise<boolean>;

  // TODO: test it creates recursively.
  mkdir: (path: string) => Promise<void>;

  rmdir: (path: string, forceDelete?: boolean) => Promise<void>;

  isDir: (path: string) => Promise<boolean>;

  isFile: (dirOrFilepath: string) => Promise<boolean>;
}

export interface IFileUploader {
  parseFormData: <T>(request: Request) => Promise<DeepPartial<T>>;

  storeFile: (params: StoreFileParams) => Promise<string>;

  storeFiles: (params: StoreFilesParams) => Promise<string[]>;

  getTempUploadDirectory: () => string;

  clearTempUploadDirectory: () => Promise<void>;
}

export interface IFileSystem extends IStorage, IFileUploader {}

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
