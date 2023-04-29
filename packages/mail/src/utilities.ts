import { baseConfig, MailConfig, MailDriver } from '@men-mvc/config';
import path from 'path';
import {
  getServerDirectory,
  getAppRootDirectory
} from './foundation';

// exposing the function just to be able to mock in the test.
export const getMailConfig = (): MailConfig => baseConfig.mail;

export const getMailDriver = (): MailDriver | undefined =>
  getMailConfig().driver;

export const isOAuth2AuthType = (): boolean =>
  getMailConfig().authType?.toLowerCase() === 'oauth2';

export const isLoginAuthType = (): boolean =>
  getMailConfig().authType?.toLowerCase() === 'login' ||
  !getMailConfig().authType; // default.

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
