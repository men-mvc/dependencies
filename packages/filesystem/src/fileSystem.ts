import { Request } from 'express';
import { ReadStream, WriteFileOptions } from 'fs';
import { FileSystemDriver } from '@men-mvc/config';
import { DeepPartial } from '@men-mvc/foundation';
import {
  BaseFileSystem,
  BaseFileUploader,
  ReadStreamOptions,
  Storage,
  StoreFileParams,
  StoreFilesParams,
  WriteFileResult
} from './types';
import { FileUploader } from './fileUploader';
import {
  getFileSystemDriver,
  getPublicStorageIdentifier,
  isPublicFilepath
} from './utilities/utilities';
import { LocalStorage } from './localStorage';
import { S3Storage } from './s3/s3Storage';

// TODO: add writeFiles
export class FileSystem implements BaseFileSystem {
  private static instance: FileSystem | null;
  private storageInstance: Storage | undefined;
  private uploaderInstance: BaseFileUploader | undefined;

  public getStorageInstance = (): Storage => {
    if (!this.storageInstance) {
      if (getFileSystemDriver() === FileSystemDriver.s3) {
        this.storageInstance = new S3Storage();
      } else {
        this.storageInstance = new LocalStorage();
      }
    }

    return this.storageInstance;
  };

  public getUploaderInstance = (): BaseFileUploader => {
    if (!this.uploaderInstance) {
      this.uploaderInstance = new FileUploader();
    }

    return this.uploaderInstance;
  };

  public static getInstance = (): BaseFileSystem => {
    if (!this.instance) {
      this.instance = new FileSystem();
    }

    return this.instance;
  };

  public static resetInstance = () => {
    this.instance = null;
  };

  public clearTempUploadDirectory = (): Promise<void> =>
    this.getUploaderInstance().clearTempUploadDirectory();

  public resetTempUploadDirId = (): void =>
    this.getUploaderInstance().resetTempUploadDirId();

  public parseFormData = async <T>(req: Request) =>
    this.getUploaderInstance().parseFormData<DeepPartial<T>>(req);

  public storeFile = async (params: StoreFileParams): Promise<string> =>
    this.getUploaderInstance().storeFile(params);

  public storeFiles = async (params: StoreFilesParams): Promise<string[]> =>
    this.getUploaderInstance().storeFiles(params);

  public getAbsoluteTempUploadDirPath = (): string =>
    this.getUploaderInstance().getAbsoluteTempUploadDirPath();

  public getAbsolutePath = (path: string) =>
    this.getStorageInstance().getAbsolutePath(path);

  public writeFile = async (
    filepath: string,
    data: string | NodeJS.ArrayBufferView,
    options?: WriteFileOptions
  ): Promise<WriteFileResult> => {
    if (isPublicFilepath(filepath)) {
      throw new Error(
        `Filename/ filepath passed to writeFile cannot start with ${getPublicStorageIdentifier()}`
      );
    }

    return this.getStorageInstance().writeFile(filepath, data, options);
  };

  public deleteFile = async (path: string): Promise<void> =>
    this.getStorageInstance().deleteFile(path);

  public deleteFiles = async (pathsOrKeys: string[]): Promise<void> =>
    this.getStorageInstance().deleteFiles(pathsOrKeys);

  public rename = async (from: string, to: string): Promise<void> =>
    this.getStorageInstance().rename(from, to);

  public copy = async (from: string, to: string): Promise<void> =>
    this.getStorageInstance().copy(from, to);

  public exists = async (path: string): Promise<boolean> =>
    this.getStorageInstance().exists(path);

  public mkdir = async (dirPath: string): Promise<void> =>
    this.getStorageInstance().mkdir(dirPath);

  public rmdir = async (
    dirPath: string,
    forceDelete?: boolean
  ): Promise<void> => this.getStorageInstance().rmdir(dirPath, forceDelete);

  public isDir = async (path: string): Promise<boolean> =>
    this.getStorageInstance().isDir(path);

  createReadStream = (
    filepath: string,
    options: ReadStreamOptions
  ): Promise<ReadStream> =>
    this.getStorageInstance().createReadStream(filepath, options);

  isFile = (dirOrFilepath: string): Promise<boolean> =>
    this.getStorageInstance().isFile(dirOrFilepath);

  readDir = (dir: string): Promise<string[]> =>
    this.getStorageInstance().readDir(dir);

  readFile = (
    filepath: string,
    options?: { encoding: BufferEncoding; flag?: string }
  ): Promise<Buffer> => this.getStorageInstance().readFile(filepath, options);
}
