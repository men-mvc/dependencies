import fs, { WriteFileOptions } from 'fs';
import rimraf from 'rimraf';
import { IStorage, ReadStreamOptions } from './types';

// TODO: add sync versions of the functions.
// TODO: use reject for promise func
// TODO: readDir recursive
// TODO: create isFile function
export class LocalStorage implements IStorage {
  public static instance: LocalStorage;
  // TODO: try using this function
  public static getInstance = (): LocalStorage => {
    if (!LocalStorage.instance) {
      LocalStorage.instance = new LocalStorage();
    }

    return LocalStorage.instance;
  };

  public readDir = async (dir: string): Promise<string[]> => {
    try {
      return await this.readDirPromise(dir);
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
  ): Promise<void> => {
    return new Promise((resolve) => {
      fs.writeFile(filepath, data, options ?? {}, (err) => {
        if (err) {
          throw err;
        }
        return resolve();
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

  public exits = async (filepath: string): Promise<boolean> => {
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

  public mkdir = async (dirPath: string): Promise<void> => {
    try {
      await this.mkdirPromise(dirPath);
    } catch (e) {
      throw e;
    }
  };

  public rmdir = async (
    dirPath: string,
    forceDelete?: boolean
  ): Promise<void> => {
    try {
      if (forceDelete) {
        await this.forceRmdirPromise(dirPath);
      } else {
        await this.rmdirPromise(dirPath);
      }
    } catch (e) {
      throw e;
    }
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

  private forceRmdirPromise = (dirPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      rimraf(dirPath, (err) => {
        if (err) {
          return reject(err);
        }
      });

      return resolve();
    });
  };

  private rmdirPromise = (dirPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      fs.rmdir(dirPath, (err) => {
        if (err) {
          return reject(err);
        }

        return resolve();
      });
    });
  };

  private readDirPromise = (dir: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      fs.readdir(dir, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  };
}
