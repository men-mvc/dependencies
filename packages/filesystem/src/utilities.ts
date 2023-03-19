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

export const getAwsS3Bucket = (): string =>
  baseConfig.fileSystem.s3?.bucket ?? ``;

export const getAwsS3Credentials = () => ({
  region: baseConfig.fileSystem?.s3?.region,
  accessKeyId: baseConfig.fileSystem?.s3?.accessKeyId ?? ``,
  secretAccessKey: baseConfig.fileSystem?.s3?.secretAccessKey ?? ``
});

export const generateUuid = (): string => globalGenerateUuid();

export const getDriver = (): FileSystemDriver =>
  baseConfig.fileSystem?.storageDriver ?? FileSystemDriver.local;
