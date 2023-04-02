import { baseConfig, MailDriver } from '@men-mvc/config';
import path from 'path';
import { getServerDirectory, isInSourceDirectory } from '../utilities';

export const getMailDriver = (): MailDriver | undefined =>
  baseConfig.mail.driver;

// TODO: unit test
export const isOAuth2AuthType = (): boolean =>
  baseConfig.mail.authType?.toLowerCase() === 'oauth2';

// TODO: unit test
export const isLoginAuthType = (): boolean =>
  baseConfig.mail.authType?.toLowerCase() === 'login' ||
  !baseConfig.mail.authType; // default.

// TODO: add custom method auth type

export const getMailTemplatesDir = (): string =>
  path.join(getServerDirectory(), 'views', 'emails');

let cachedMailLogsDir: string | null = null;
export const getMailLogsDir = (): string => {
  if (cachedMailLogsDir) {
    return cachedMailLogsDir;
  }
  const dirname = `mailLogs`;
  const serverDirectory = getServerDirectory();
  if (!isInSourceDirectory()) {
    cachedMailLogsDir = path.join(serverDirectory, dirname);
    return cachedMailLogsDir;
  }
  // this is already in source code directory so path always should end with src
  const serverDirSegments = serverDirectory.split(path.sep);
  if (serverDirSegments.length <= 1) {
    cachedMailLogsDir = dirname;
    return cachedMailLogsDir;
  }
  serverDirSegments.pop();

  cachedMailLogsDir = path.join(serverDirSegments.join(path.sep), dirname);

  return cachedMailLogsDir;
};

export const clearCachedMailLogsDirname = () => {
  cachedMailLogsDir = null;
};
