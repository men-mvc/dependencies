import fs, { WriteFileOptions } from 'fs';
import path from 'path';
import { Storage, ReadStreamOptions, WriteFileResult } from './types';
import {
  copyFileAsync,
  getAppStorageDirectory, mkdirAsync,
  readdirAsync,
  readFileAsync,
  renameAsync,
  rmdirAsync,
  unlinkAsync,
  writeFileAsync
} from './utilities';

/**
 * TODO: improvement
 * - readDir recursive
 * TODO: do we need to add a function called getAbsolutePath
 * TODO: writeFilePublicly or pass additional argument?
 * TODO: writeFiler result- add absoluteFilepath keeping filepath for both s3 and local
 */
export class LocalStorage implements Storage {
  public static instance: LocalStorage;

  // TODO: finish
  private createStorageCompatiblePath = (dirOrFilePath: string) => {
    // TODO: is this not getting absolute path?
    // TODO: check if leading slash matter
    return path.join(getAppStorageDirectory(), dirOrFilePath);
  };

  public static getInstance = (): LocalStorage => {
    if (!LocalStorage.instance) {
      LocalStorage.instance = new LocalStorage();
    }

    return LocalStorage.instance;
  };

  // TODO: test
  public getAbsolutePath = (dirOrFilePath: string): string => {
    return path.join(getAppStorageDirectory(), dirOrFilePath);
  }

  public readDir = (dir: string): Promise<string[]> =>
    readdirAsync(this.createStorageCompatiblePath(dir));

  public readFile = async (
    filepath: string,
    options?: {
      encoding: BufferEncoding;
      flag?: string | undefined;
    }
  ): Promise<Buffer> => {
    const absolutePath = this.createStorageCompatiblePath(filepath);
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
    const stream = fs.createReadStream(
      this.createStorageCompatiblePath(filepath),
      {
        highWaterMark: options?.highWaterMark,
        encoding: options?.encoding ?? `utf-8`
      }
    );

    return stream;
  };

  public writeFile = async (
    filepath: string,
    data: string | NodeJS.ArrayBufferView,
    options?: WriteFileOptions
  ): Promise<WriteFileResult> => {
    const absoluteFilepath = this.createStorageCompatiblePath(filepath);
    await writeFileAsync(
      this.createStorageCompatiblePath(filepath),
      data,
      options ?? {}
    );

    return {
      filepath: absoluteFilepath
    };
  };

  public deleteFile = async (filepath: string): Promise<void> =>
    unlinkAsync(this.createStorageCompatiblePath(filepath));

  public deleteFiles = async (filepaths: string[]): Promise<void> => {
    if (filepaths.length < 1) {
      return;
    }

    await Promise.all(
      filepaths.map((path) =>
        unlinkAsync(this.createStorageCompatiblePath(path))
      )
    );
  };

  public rename = async (from: string, to: string): Promise<void> =>
    renameAsync(
      this.createStorageCompatiblePath(from),
      this.createStorageCompatiblePath(to)
    );

  public copy = async (from: string, to: string): Promise<void> => {
    if (from === to) {
      return;
    }

    await copyFileAsync(
      this.createStorageCompatiblePath(from),
      this.createStorageCompatiblePath(to)
    );
  };

  public exists = async (filepath: string): Promise<boolean> => {
    return new Promise((resolve) => {
      fs.stat(this.createStorageCompatiblePath(filepath), (error) => {
        if (!error) {
          return resolve(true);
        }
        if (error.code === 'ENOENT') {
          return resolve(false);
        }

        throw error;
      });
    });
  };

  public mkdir = async (dirPath: string): Promise<void> => {
    await mkdirAsync(this.createStorageCompatiblePath(dirPath), { recursive: true });
  }

  public rmdir = async (
    dirPath: string,
    forceDelete?: boolean
  ): Promise<void> => {
    await rmdirAsync(this.createStorageCompatiblePath(dirPath), {
      recursive: !!forceDelete
    });
  };

  public isDir = async (dirOrFilepath: string): Promise<boolean> => {
    try {
      return await this.isDirPromise(this.createStorageCompatiblePath(dirOrFilepath));
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
