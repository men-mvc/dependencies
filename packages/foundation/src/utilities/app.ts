import path from 'path';
import { getEnvVariable, setEnvVariable, srcDirectory } from '@men-mvc/config';
import { BaseApplication } from '../types';

export const setServerDirectory = (dir: string) =>
  setEnvVariable('SERVER_DIRECTORY', dir);

export const getServerDirectory = (): string =>
  getEnvVariable('SERVER_DIRECTORY', '') ?? ``;

let cachedAppRootDirectory: string | null = null;
export const getAppRootDirectory = (): string => {
  if (cachedAppRootDirectory) {
    return cachedAppRootDirectory;
  }

  let serverDirectory = getServerDirectory();
  if (!serverDirectory) {
    throw new Error(
      `Unable to get app project directory as the server directory is not set.`
    );
  }
  if (!isInSourceDirectory()) {
    // for prod build, server directory is the app root directory
    cachedAppRootDirectory = serverDirectory;
    return cachedAppRootDirectory;
  }
  // path will end with src as isInSourceDirectory returns true
  if (serverDirectory.endsWith(path.sep)) {
    serverDirectory = serverDirectory.slice(0, -1);
  }
  const segments = serverDirectory.split(path.sep);
  segments.pop(); // remove the src

  cachedAppRootDirectory = segments.join(path.sep);
  return cachedAppRootDirectory;
};

export const clearAppRootDirectoryCache = () => {
  cachedAppRootDirectory = null;
};

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

export const getAppBaseUrl = (): string => {
  if (getEnvVariable(`APP_BASE_URL`)) {
    return getEnvVariable(`APP_BASE_URL`) as string;
  }

  const req = BaseApplication.getInstance().app.request;

  return req.protocol + '://' + req.get('host');
};
