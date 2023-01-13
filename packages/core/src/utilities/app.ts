import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {getEnvVariable} from "@men-mvc/config";

// TODO: rename the file into the storage
let storageDirectory: string;
export const getAppStorageDirectory = (): string => {
  if (!storageDirectory) {
    if (getEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, ``)) {
      storageDirectory = getEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, ``);
    } else {
      storageDirectory = path.join(process.cwd(), `storage`);
    }
  }

  return storageDirectory;
};

export const generateUuid = () => uuidv4();
