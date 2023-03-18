import fs, { WriteFileOptions } from 'fs';
import util from 'util';
import { Storage, ReadStreamOptions, WriteFileResult } from './types';

const readdirAsync = util.promisify(fs.readdir);
const rmdirAsync = util.promisify(fs.rmdir);
const unlinkAsync = util.promisify(fs.unlink);

/**
 * TODO: improvements
 * - add sync versions of the functions.
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

  public readDir = async (dir: string): Promise<string[]> => {
    try {
      return await readdirAsync(dir);
    } catch (e) {
      throw e;
    }
  };

  public readFile = async (
    filepath: string,
    options?: {
      encoding: BufferEncoding;
      flag?: string | undefined;
    }
  ): Promise<Buffer> => {
    try {
      return await this.readFilePromise(filepath, options);
    } catch (e) {
      throw e;
    }
  };

  public createReadStream = async (
    filepath: string,
    options?: ReadStreamOptions
  ): Promise<fs.ReadStream> => {
    const stream = fs.createReadStream(filepath, {
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
    return new Promise((resolve) => {
      fs.writeFile(filepath, data, options ?? {}, (err) => {
        if (err) {
          throw err;
        }
        return resolve({
          filepath
        });
      });
    });
  };

  public deleteFile = async (filepath: string): Promise<void> => {
    return new Promise((resolve) => {
      fs.unlink(filepath, (err) => {
        if (err) {
          throw err;
        }
        return resolve();
      });
    });
  };

  public deleteFiles = async (filepaths: string[]): Promise<void> => {
    if (filepaths.length < 1) {
      return;
    }

    await Promise.all(filepaths.map((path) => unlinkAsync(path)));
  };

  public rename = async (from: string, to: string): Promise<void> => {
    return new Promise((resolve) => {
      fs.rename(from, to, (err) => {
        if (err) {
          throw err;
        }
        return resolve();
      });
    });
  };

  public copy = async (from: string, to: string): Promise<void> => {
    try {
      if (from === to) {
        return;
      }

      const copyFilePromise = util.promisify(fs.copyFile);
      await copyFilePromise(from, to);
    } catch (e) {
      throw e;
    }
  };

  public exists = async (filepath: string): Promise<boolean> => {
    return new Promise((resolve) => {
      fs.stat(filepath, (error) => {
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
    await this.mkdirPromise(dirPath);
  };

  public rmdir = async (
    dirPath: string,
    forceDelete?: boolean
  ): Promise<void> => {
    await rmdirAsync(dirPath, {
      recursive: !!forceDelete
    });
  };

  public isDir = async (dirOrFilepath: string): Promise<boolean> => {
    try {
      return await this.isDirPromise(dirOrFilepath);
    } catch (e) {
      throw e;
    }
  };

  public isFile = async (dirOrFilepath: string): Promise<boolean> => {
    const isDir = await this.isDir(dirOrFilepath);

    return !isDir;
  };

  private readFilePromise = (
    filepath: string,
    options?: {
      encoding: BufferEncoding;
      flag?: string | undefined;
    }
  ): Promise<Buffer> => {
    return new Promise<Buffer>((resolve, reject) => {
      const encoding: BufferEncoding =
        options && options.encoding ? options.encoding : `utf-8`;
      fs.readFile(filepath, options ?? {}, (err, data) => {
        if (err) {
          return reject(err);
        }

        return resolve(
          typeof data === 'string' ? Buffer.from(data, encoding) : data
        );
      });
    });
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

  private mkdirPromise = (dirPath: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      fs.promises
        .mkdir(dirPath, { recursive: true })
        .then(() => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  };
}
