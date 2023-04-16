import fs, { WriteFileOptions } from 'fs';
import path from 'path';
import { Storage, ReadStreamOptions, WriteFileResult } from './types';
import {
  getPathInStorage,
  copyFileAsync,
  existsAsync,
  getPrivateStorageDirectory,
  getPublicStorageDirectory,
  getPublicStorageDirname,
  getStorageDirectory,
  mkdirAsync,
  readdirAsync,
  readFileAsync,
  removePublicStorageIdentifierFrom,
  renameAsync,
  rmdirAsync,
  unlinkAsync,
  writeFileAsync
} from './utilities/utilities';
import { getAppBaseUrl } from './foundation';

/**
 * TODO: improvement
 * - readDir recursive
 */
export class LocalStorage implements Storage {
  public static instance: LocalStorage;

  public static getInstance = (): LocalStorage => {
    if (!LocalStorage.instance) {
      LocalStorage.instance = new LocalStorage();
    }

    return LocalStorage.instance;
  };

  public getPublicUrl = (filepath: string): string => {
    return `${getAppBaseUrl()}/${removePublicStorageIdentifierFrom(filepath)}`;
  };

  public getAbsolutePath = (dirOrFilePath: string): string => {
    return path.join(getStorageDirectory(), dirOrFilePath);
  };

  public readDir = (dir: string): Promise<string[]> =>
    readdirAsync(this.getAbsolutePath(dir));

  public readFile = async (
    filepath: string,
    options?: {
      encoding: BufferEncoding;
      flag?: string | undefined;
    }
  ): Promise<Buffer> => {
    const absolutePath = this.getAbsolutePath(filepath);
    const encoding: BufferEncoding =
      options && options.encoding ? options.encoding : `utf-8`;
    const content = await readFileAsync(absolutePath, options ?? {});
    return typeof content === 'string'
      ? Buffer.from(content, encoding)
      : content;
  };

  public createReadStream = async (
    filepath: string,
    options?: ReadStreamOptions
  ): Promise<fs.ReadStream> => {
    const stream = fs.createReadStream(this.getAbsolutePath(filepath), {
      highWaterMark: options?.highWaterMark,
      encoding: options?.encoding ?? `utf-8`
    });

    return stream;
  };

  public writeFile = async (
    filepath: string,
    data: string | NodeJS.ArrayBufferView,
    options?: WriteFileOptions
  ): Promise<WriteFileResult> => {
    const pathInStorage = getPathInStorage(filepath);
    const absoluteFilepath = this.getAbsolutePath(pathInStorage);
    await writeFileAsync(absoluteFilepath, data, options ?? {});

    return {
      pathInStorage,
      absoluteFilepath: absoluteFilepath
    };
  };

  public writeFilePublicly = async (
    filepath: string,
    data: string | NodeJS.ArrayBufferView,
    options?: WriteFileOptions
  ): Promise<WriteFileResult> => {
    const pathInStorage = getPathInStorage(filepath, true);
    const absoluteFilepath = this.getAbsolutePath(pathInStorage);
    await writeFileAsync(absoluteFilepath, data, options ?? {});

    return {
      pathInStorage,
      absoluteFilepath: absoluteFilepath
    };
  };

  public deleteFile = async (filepath: string): Promise<void> =>
    unlinkAsync(this.getAbsolutePath(filepath));

  public deleteFiles = async (filepaths: string[]): Promise<void> => {
    if (filepaths.length < 1) {
      return;
    }

    await Promise.all(
      filepaths.map((path) => unlinkAsync(this.getAbsolutePath(path)))
    );
  };

  public rename = async (from: string, to: string): Promise<void> =>
    renameAsync(this.getAbsolutePath(from), this.getAbsolutePath(to));

  public copy = async (from: string, to: string): Promise<void> => {
    if (from === to) {
      return;
    }

    await copyFileAsync(this.getAbsolutePath(from), this.getAbsolutePath(to));
  };

  public exists = async (filepath: string): Promise<boolean> =>
    existsAsync(this.getAbsolutePath(filepath));

  public mkdir = async (dirPath: string): Promise<void> => {
    await mkdirAsync(this.getAbsolutePath(dirPath), {
      recursive: true
    });
  };

  public rmdir = async (
    dirPath: string,
    forceDelete?: boolean
  ): Promise<void> => {
    await rmdirAsync(this.getAbsolutePath(dirPath), {
      recursive: !!forceDelete
    });
  };

  public isDir = async (dirOrFilepath: string): Promise<boolean> => {
    try {
      return await this.isDirPromise(this.getAbsolutePath(dirOrFilepath));
    } catch (e) {
      throw e;
    }
  };

  public isFile = async (dirOrFilepath: string): Promise<boolean> => {
    const isDir = await this.isDir(dirOrFilepath);

    return !isDir;
  };

  private isDirPromise = (dirOrFilepath: string): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
      fs.stat(dirOrFilepath, (error, stats) => {
        if (error) {
          return reject(error);
        }

        return resolve(stats.isDirectory());
      });
    });
  };
}
