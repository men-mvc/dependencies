import { Request, Response } from 'express';
import { baseConfig, FileSystemDriver, getEnvVariable } from '@men-mvc/config';
import {
  generateUuid as globalGenerateUuid,
  invokeRequestErrorHandler
} from '@men-mvc/foundation';
import path from 'path';
import util from 'util';
import fs from 'fs';
import { getAppRootDirectory } from '../foundation';

export const getDefaultAppStorageDirectory = (): string =>
  path.join(getAppRootDirectory(), `storage`);

let privateStorageDirectoryCache: string | null = null;
export const getPrivateStorageDirectory = (): string => {
  if (privateStorageDirectoryCache) {
    return privateStorageDirectoryCache;
  }
  let storageDirectory: string;
  const envVarStorageDir = getEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, ``);
  if (envVarStorageDir) {
    storageDirectory = envVarStorageDir;
  } else {
    storageDirectory = getDefaultAppStorageDirectory();
  }

  privateStorageDirectoryCache = storageDirectory;

  return privateStorageDirectoryCache;
};

// ! if we are to add more logic in the future, unit test
export const getPublicStorageIdentifier = () => {
  return `men-public`;
};

export const getPublicStorageDirectory = (): string =>
  path.join(getPrivateStorageDirectory(), getPublicStorageIdentifier());

export const clearPrivateStorageDirectoryCache = () => {
  privateStorageDirectoryCache = null;
};

export const getUploadFilesizeLimit = (): number =>
  baseConfig.fileSystem.maxUploadLimit;

export const getFileSystemDriver = (): FileSystemDriver =>
  baseConfig.fileSystem.storageDriver;

export const generateUuid = (): string => globalGenerateUuid();

export const getDriver = (): FileSystemDriver =>
  baseConfig.fileSystem?.storageDriver ?? FileSystemDriver.local;

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
  if (storageFilepath.startsWith(path.sep)) {
    storageFilepath = storageFilepath.substring(1);
  }

  return storageFilepath.startsWith(getPublicStorageIdentifier());
};

export const existsAsync = util.promisify(fs.exists);
export const readdirAsync = util.promisify(fs.readdir);
export const rmdirAsync = util.promisify(fs.rmdir);
export const unlinkAsync = util.promisify(fs.unlink);
export const readFileAsync = util.promisify(fs.readFile);
export const writeFileAsync = util.promisify(fs.writeFile);
export const renameAsync = util.promisify(fs.rename);
export const copyFileAsync = util.promisify(fs.copyFile);
export const mkdirAsync = util.promisify(fs.mkdir);
