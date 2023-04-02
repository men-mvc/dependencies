import path from 'path';
import { getEnvVariable, setEnvVariable, srcDirectory } from '@men-mvc/config';

export const setServerDirectory = (dir: string) =>
  setEnvVariable('SERVER_DIRECTORY', dir);

export const getServerDirectory = (): string =>
  getEnvVariable('SERVER_DIRECTORY', '') ?? ``;

// if the server is inside the /src folder, this function returns true.
let isInSourceDirCachedValue: boolean | null = null;
export const isInSourceDirectory = (): boolean => {
  if (isInSourceDirCachedValue !== null) {
    return isInSourceDirCachedValue;
  }

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

  isInSourceDirCachedValue = lastSegment.toLowerCase() === srcDirectory;

  return isInSourceDirCachedValue;
};

export const clearIsInSourceDirCachedValue = () => {
  isInSourceDirCachedValue = null;
};
