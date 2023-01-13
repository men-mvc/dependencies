import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getEnvVariable } from '@men-mvc/config';

export const _getEnvVarStorageDirectory = (): string =>
  getEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, ``);

export const getAppStorageDirectory = (): string => {
  let storageDirectory: string;
  const envVarStorageDir = _getEnvVarStorageDirectory();
  if (envVarStorageDir) {
    storageDirectory = envVarStorageDir;
  } else {
    storageDirectory = path.join(process.cwd(), `storage`);
  }

  return storageDirectory;
};

export const generateUuid = () => uuidv4();
