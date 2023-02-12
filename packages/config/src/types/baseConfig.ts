import { CacheDriver } from './cacheDriver';
import { MailConfig } from './mailConfig';
import { FileSystemDriver } from './fileSystemDriver';

/**
 * ! 28 mutable props - when a new prop is added to the BaseConfig, update this variable too
 */
export const CONFIG_VARIABLES_COUNT = 28;

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
  mail: MailConfig;
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
