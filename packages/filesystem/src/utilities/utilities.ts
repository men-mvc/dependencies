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

let appStorageDirectoryCache: string | null = null;
export const getAppStorageDirectory = (): string => {
  if (appStorageDirectoryCache) {
    return appStorageDirectoryCache;
  }
  let storageDirectory: string;
  const envVarStorageDir = getEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, ``);
  if (envVarStorageDir) {
    storageDirectory = envVarStorageDir;
  } else {
    storageDirectory = getDefaultAppStorageDirectory();
  }

  appStorageDirectoryCache = storageDirectory;

  return appStorageDirectoryCache;
};

export const clearAppStorageDirectoryCache = () => {
  appStorageDirectoryCache = null;
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

export const readdirAsync = util.promisify(fs.readdir);
export const rmdirAsync = util.promisify(fs.rmdir);
export const unlinkAsync = util.promisify(fs.unlink);
export const readFileAsync = util.promisify(fs.readFile);
export const writeFileAsync = util.promisify(fs.writeFile);
export const renameAsync = util.promisify(fs.rename);
export const copyFileAsync = util.promisify(fs.copyFile);
export const mkdirAsync = util.promisify(fs.mkdir);
