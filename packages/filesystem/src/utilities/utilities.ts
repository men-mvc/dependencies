import { Request, Response } from 'express';
import {
  BaseConfig,
  baseConfig,
  FileSystemDriver,
  getEnvVariable
} from '@men-mvc/config';
import {
  generateUuid as _generateUuid,
  invokeRequestErrorHandler
} from '@men-mvc/foundation';
import path from 'path';
import util from 'util';
import fs from 'fs';
import { getAppRootDirectory } from '../foundation';

export const getBaseConfig = (): BaseConfig => baseConfig;

export const isUsingCloudFront = (): boolean =>
  !!getBaseConfig().fileSystem?.s3?.cloudfront?.domainName;

export const getStorageDirname = () =>
  getBaseConfig().fileSystem?.storageDirname ?? `storage`;

export const getStorageDirectory = (): string =>
  path.join(getAppRootDirectory(), getStorageDirname());

// ! if we are to add more logic in the future, unit test
export const getPublicStorageDirname = () => {
  return `men-public`;
};

// ! if we are to add more logic in the future, unit test
export const getPrivateStorageDirname = () => {
  return `men-private`;
};

export const getPublicStorageDirectory = (): string =>
  path.join(getStorageDirectory(), getPublicStorageDirname());

export const getPrivateStorageDirectory = (): string =>
  path.join(getStorageDirectory(), getPrivateStorageDirname());

export const getPathInStorage = (clientFilepath: string, isPublic = false) => {
  clientFilepath = removeLeadingPathSep(clientFilepath);

  return path.join(
    isPublic ? getPublicStorageDirname() : getPrivateStorageDirname(),
    clientFilepath
  );
};

export const removeLeadingPathSep = (filepath: string) => {
  if (filepath.startsWith(path.sep) || filepath.startsWith('/')) {
    if (filepath.startsWith(path.sep)) {
      filepath = filepath.substring(1);
    }
    if (filepath.startsWith('/')) {
      filepath = filepath.substring(1);
    }
  }

  return filepath;
};

export const getUploadFilesizeLimit = (): number =>
  baseConfig.fileSystem.maxUploadLimit;

export const generateUuid = _generateUuid;

export const getDriver = (): FileSystemDriver =>
  getBaseConfig().fileSystem?.storageDriver ?? FileSystemDriver.local;

export const invokeAppRequestErrorHandler = (
  error: Error,
  req: Request,
  res: Response
) => invokeRequestErrorHandler(error, req, res);

export const parseMultiFormBooleanInput = (
  input: string | number | boolean
) => {
  if (typeof input === 'string') {
    return input.toLowerCase() === 'true';
  } else if (typeof input === 'number') {
    return input > 0;
  } else {
    // boolean
    return input;
  }
};

export const isPublicFilepath = (storageFilepath: string) => {
  storageFilepath = removeLeadingPathSep(storageFilepath);

  return storageFilepath.startsWith(getPublicStorageDirname());
};

export const isPrivateFilepath = (storageFilepath: string) => {
  storageFilepath = removeLeadingPathSep(storageFilepath);

  return storageFilepath.startsWith(getPrivateStorageDirname());
};

/**
 * ! there is no dedicated unit test for this function. But this is tested in the integration test for registerFilesystem middleware
 */
export const createStorageDirectoryIfNotExists = async () => {
  if (!(await existsAsync(getStorageDirectory()))) {
    await mkdirAsync(getStorageDirectory(), {
      recursive: true
    });
  }
  if (!(await existsAsync(getPublicStorageDirectory()))) {
    await mkdirAsync(getPublicStorageDirectory(), {
      recursive: true
    });
  }
  if (!(await existsAsync(getPrivateStorageDirectory()))) {
    await mkdirAsync(getPrivateStorageDirectory(), {
      recursive: true
    });
  }
};

export const removePublicStorageDirnameFrom = (
  filePathOrKey: string
): string => {
  if (!isPublicFilepath(filePathOrKey)) {
    return filePathOrKey;
  }

  // replace the first occurrence
  let finalPath = filePathOrKey.replace(getPublicStorageDirname(), '');
  finalPath = removeLeadingPathSep(finalPath);

  return finalPath;
};

export const getLocalUrlSignerSecret = () =>
  getBaseConfig().fileSystem?.local?.urlSignerSecret ?? ``;

export const existsAsync = util.promisify(fs.exists);
export const readdirAsync = util.promisify(fs.readdir);
export const rmdirAsync = util.promisify(fs.rmdir);
export const unlinkAsync = util.promisify(fs.unlink);
export const readFileAsync = util.promisify(fs.readFile);
export const writeFileAsync = util.promisify(fs.writeFile);
export const renameAsync = util.promisify(fs.rename);
export const copyFileAsync = util.promisify(fs.copyFile);
export const mkdirAsync = util.promisify(fs.mkdir);
