import { ReadStream, WriteFileOptions } from 'fs';
import {
  MenS3Adapter,
  ReadStreamOptions,
  Storage,
  WriteFileResult
} from '../types';
import {
  getPathInStorage,
  getPrivateStorageDirname,
  getPublicStorageDirname,
  isUsingCloudFront,
  removeLeadingPathSep
} from '../utilities/utilities';
import { getAppBaseUrl, replaceRouteParams } from '../foundation';
import { viewPublicS3ObjectRoute } from './viewPublicS3ObjectHandler';

const showWarningForUsingOptions = () => {
  console.warn(
    'options argument of writeFile function is not supported for S3 filesystem.'
  );
};

export class S3Storage implements Storage {
  private adapter: MenS3Adapter | undefined;

  public getS3Adapter = (): MenS3Adapter => {
    try {
      if (this.adapter) {
        return this.adapter;
      }
      const s3Adapter = require(`@men-mvc/s3-adapter`);
      this.adapter = new s3Adapter.MenS3Adapter() as MenS3Adapter;

      return this.adapter;
    } catch (e) {
      throw e;
    }
  };

  public getPublicUrl = (key: string): string => {
    if (isUsingCloudFront()) {
      return `${this.getS3Adapter().getCloudFrontDomain()}/${removeLeadingPathSep(
        key
      )}`;
    }

    return `${getAppBaseUrl()}${replaceRouteParams(viewPublicS3ObjectRoute, {
      key: encodeURIComponent(key)
    })}`;
  };

  public getSignedUrl = (key: string, durationInSeconds?: number): string => {
    return this.getS3Adapter().getSignedUrl(key, durationInSeconds);
  };

  /**
   * !  path will always have public storage or private storage prefix
   */
  public getAbsolutePath = (path: string): string => path;

  public createReadStream = async (
    key: string,
    options?: ReadStreamOptions
  ): Promise<ReadStream> => {
    if (options) {
      console.warn(
        'createReadStream does not support second argument (options) for the S3 driver.'
      );
    }

    return this.getS3Adapter().createReadStream(key);
  };

  public copy = async (fromKey: string, toKey: string): Promise<void> =>
    this.getS3Adapter().copy(fromKey, toKey);

  public rename = async (fromKey: string, toKey: string): Promise<void> =>
    this.getS3Adapter().rename(fromKey, toKey);

  public writeFile = async (
    key: string, // for s3 this will be the key
    data: string | NodeJS.ArrayBufferView, // content is the content for the S3
    options?: WriteFileOptions // What about this? - not available for S3
  ): Promise<WriteFileResult> => {
    if (options) {
      showWarningForUsingOptions();
    }
    key = removeLeadingPathSep(key);
    key = `${getPrivateStorageDirname()}/${key}`;

    const result = await this.getS3Adapter().writeFile(key, data);

    return {
      ...result,
      pathInStorage: key,
      absoluteFilepath: key
    };
  };

  public writeFilePublicly = async (
    key: string,
    data: string | NodeJS.ArrayBufferView,
    options?: WriteFileOptions
  ): Promise<WriteFileResult> => {
    if (options) {
      showWarningForUsingOptions();
    }
    key = removeLeadingPathSep(key);
    key = `${getPublicStorageDirname()}/${key}`;

    const result = await this.getS3Adapter().writeFile(key, data);

    return {
      ...result,
      pathInStorage: key,
      absoluteFilepath: key
    };
  };

  public deleteFile = async (key: string): Promise<void> =>
    this.getS3Adapter().deleteFile(key);

  public deleteFiles = async (pathsOrKeys: string[]): Promise<void> =>
    this.getS3Adapter().deleteFiles(pathsOrKeys);

  public exists = async (pathOrKey: string): Promise<boolean> =>
    this.getS3Adapter().exists(pathOrKey);

  public readDir = async (keyPrefix: string): Promise<string[]> =>
    this.getS3Adapter().readDir(keyPrefix);

  public mkdir = async (path: string): Promise<string> => {
    path = removeLeadingPathSep(path);
    await this.getS3Adapter().mkdir(path);

    return path;
  };

  public mkdirPublic = async (dir: string): Promise<string> => {
    dir = getPathInStorage(dir, true);
    await this.getS3Adapter().mkdir(dir);

    return dir;
  };

  public mkdirPrivate = async (dir: string): Promise<string> => {
    dir = getPathInStorage(dir);
    await this.getS3Adapter().mkdir(dir);

    return dir;
  };

  public rmdir = async (path: string, forceDelete?: boolean): Promise<void> =>
    this.getS3Adapter().rmdir(path, forceDelete);

  public readFile = async (key: string): Promise<Buffer> =>
    this.getS3Adapter().readFile(key);

  public isFile = async (key: string): Promise<boolean> =>
    this.getS3Adapter().isFile(key);

  public isDir = async (pathOrKey: string): Promise<boolean> =>
    this.getS3Adapter().isDir(pathOrKey);
}
