import { Request } from 'express';
import { ReadStream, WriteFileOptions } from 'fs';
import {
  IFileSystem,
  IFileUploader,
  IStorage,
  ReadStreamOptions,
  StoreFileParams,
  StoreFilesParams
} from './types';
import { LocalStorage } from './localStorage';
import { DeepPartial } from '../types';
import { FileUploader } from './fileUploader';

export class FileSystem implements IFileSystem {
  private static instance: IFileSystem;
  private static storageInstance: IStorage;
  private static uploaderInstance: IFileUploader;

  private getStorageInstance = (): IStorage => {
    if (!FileSystem.storageInstance) {
      FileSystem.storageInstance = new LocalStorage();
    }

    return FileSystem.storageInstance;
  };

  private getUploaderInstance = (): IFileUploader => {
    if (!FileSystem.uploaderInstance) {
      FileSystem.uploaderInstance = new FileUploader();
    }

    return FileSystem.uploaderInstance;
  };

  public static getInstance = (): IFileSystem => {
    if (!FileSystem.instance) {
      FileSystem.instance = new FileSystem();
    }

    return FileSystem.instance;
  };

  public clearTempUploadDirectory = (): Promise<void> =>
    this.getUploaderInstance().clearTempUploadDirectory();

  public parseFormData = async <T>(req: Request) =>
    this.getUploaderInstance().parseFormData<DeepPartial<T>>(req);

  public storeFile = async (params: StoreFileParams): Promise<string> =>
    this.getUploaderInstance().storeFile(params);

  public storeFiles = async (params: StoreFilesParams): Promise<string[]> =>
    this.getUploaderInstance().storeFiles(params);

  public getTempUploadDirectory = (): string =>
    this.getUploaderInstance().getTempUploadDirectory();

  public writeFile = async (
    filepath: string,
    data: string | NodeJS.ArrayBufferView,
    options?: WriteFileOptions
  ): Promise<void> =>
    this.getStorageInstance().writeFile(filepath, data, options);

  public deleteFile = async (path: string): Promise<void> =>
    this.getStorageInstance().deleteFile(path);

  public rename = async (from: string, to: string): Promise<void> =>
    this.getStorageInstance().rename(from, to);

  public exits = async (path: string): Promise<boolean> =>
    this.getStorageInstance().exits(path);

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
