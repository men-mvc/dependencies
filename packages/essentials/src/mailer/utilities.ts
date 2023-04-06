import { baseConfig, MailDriver } from '@men-mvc/config';
import path from 'path';
import {
  getServerDirectory,
  getAppRootDirectory
} from '../utilities/foundation';

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
  cachedMailLogsDir = path.join(getAppRootDirectory(), `mailLogs`);

  return cachedMailLogsDir;
};

export const clearCachedMailLogsDirname = () => {
  cachedMailLogsDir = null;
};
