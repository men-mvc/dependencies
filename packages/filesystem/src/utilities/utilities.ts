import { Request, Response } from 'express';
import {
  BaseConfig,
  baseConfig,
  FileSystemDriver,
  getEnvVariable
} from '@men-mvc/config';
import mimeTypes from 'mime-types';
import {
  generateUuid as _generateUuid,
  invokeRequestErrorHandler
} from '@men-mvc/foundation';
import path from 'path';
import util from 'util';
import fs from 'fs';
import { getAppRootDirectory } from '../foundation';

export const getBaseConfig = (): BaseConfig => baseConfig;

export const getCloudFrontDomain = () =>
  getBaseConfig().fileSystem?.s3?.cloudfront?.domainName ?? ``;

export const isUsingCloudFront = () => !!getCloudFrontDomain();

export const getDefaultAppStorageDirectory = (): string =>
  path.join(getAppRootDirectory(), `storage`);

let storageDirectoryCache: string | null = null;
export const getStorageDirectory = (): string => {
  if (storageDirectoryCache) {
    return storageDirectoryCache;
  }
  let storageDirectory: string;
  const envVarStorageDir = getEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, ``);
  if (envVarStorageDir) {
    storageDirectory = envVarStorageDir;
  } else {
    storageDirectory = getDefaultAppStorageDirectory();
  }

  storageDirectoryCache = storageDirectory;

  return storageDirectoryCache;
};

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

export const clearStorageDirectoryCache = () => {
  storageDirectoryCache = null;
};

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

export const getMimeType = (filePathOrName: string): string | null => {
  const mimeType = mimeTypes.lookup(filePathOrName);
  return mimeType ? mimeType : null;
};

export const removePublicStorageIdentifierFrom = (
  filePathOrKey: string
): string => {
  if (!isPublicFilepath(filePathOrKey)) {
    return filePathOrKey;
  }

  // replace the first occurrence
  let finalPath = filePathOrKey.replace(getPublicStorageDirname(), '');
  if (finalPath.startsWith(path.sep)) {
    finalPath = finalPath.substring(1);
  }

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
