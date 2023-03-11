import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getEnvVariable, setEnvVariable, srcDirectory } from '@men-mvc/config';

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

export const generateUuid = () => uuidv4();

export const setServerDirectory = (dir: string) =>
  setEnvVariable('SERVER_DIRECTORY', dir);

export const getServerDirectory = () => getEnvVariable('SERVER_DIRECTORY', '');

// if the server is inside the /src folder, this function returns true.
export const isInSourceDirectory = (): boolean => {
  let serverDir = getServerDirectory();
  if (!serverDir) {
    throw new Error(`Application server is missing.`);
  }
  if (serverDir.endsWith(path.sep)) {
    serverDir = serverDir.slice(0, -1); // remove the last character which is path.sep
  }
  const segments = serverDir.split(path.sep);
  let lastSegment = segments[segments.length - 1];
  if (!lastSegment) {
    throw new Error(
      `Application server does not exist in the src or dist folder.`
    );
  }

  return lastSegment.toLowerCase() === srcDirectory;
};

export const getSourceCodeDirectory = (): string =>
  path.join(
    process.cwd(),
    isInSourceDirectory() ? srcDirectory : '' // for dist, the process.cwd will be current directory as it is starting server.js executing "node server.js"
  );
