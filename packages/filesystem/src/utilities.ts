import { baseConfig, FileSystemDriver, getEnvVariable } from '@men-mvc/config';
import { generateUuid as globalGenerateUuid } from '@men-mvc/globals';
import path from 'path';

export const getAppStorageDirectory = (): string => {
  let storageDirectory: string;
  const envVarStorageDir = getEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, ``);
  if (envVarStorageDir) {
    storageDirectory = envVarStorageDir;
  } else {
    storageDirectory = path.join(process.cwd(), `storage`);
  }

  return storageDirectory;
};

export const getUploadFilesizeLimit = (): number =>
  baseConfig.fileSystem.maxUploadLimit;

export const getFileSystemDriver = (): FileSystemDriver =>
  baseConfig.fileSystem.storageDriver;

export const generateUuid = (): string => globalGenerateUuid();

export const getDriver = (): FileSystemDriver =>
  baseConfig.fileSystem?.storageDriver ?? FileSystemDriver.local;
