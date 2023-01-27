import { CacheDriver, FileSystemDriver, MailDriver } from './globals';

/**
 * ! 27 mutable props - when a new prop is added to the BaseConfig, update this variable too
 */
export const CONFIG_VARIABLES_COUNT = 27;

/**
 * ! find a way to validate there is an ENV variable declared for each prop.
 */
export interface BaseConfig {
  app: {
    name: string;
  };
  server: {
    port: number;
  };
  auth: {
    secret: string;
    tokenExpiresIn: string;
    passwordResetLinkDuration: number;
    emailVerificationLinkDuration: number;
  };
  mail: {
    driver?: MailDriver;
    user: string;
    password: string;
    host?: string;
    port?: number;
    service?: string;
    secure?: boolean;
    authType?: string;
    tlsCiphers?: string;
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    accessToken?: string;
    expires?: number;
  };
  cache: {
    driver?: CacheDriver;
    redis?: {
      port: number;
      host: string;
      password?: string;
      database?: number;
    };
  };
  fileSystem: {
    storageDriver: FileSystemDriver;
    maxUploadLimit: number; // in bytes
  };
}
