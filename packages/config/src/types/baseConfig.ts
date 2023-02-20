import { CacheDriver } from './cacheDriver';
import { MailConfig } from './mailConfig';
import { FileSystemDriver } from './fileSystemDriver';

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
  logging?: {
    disabled?: boolean;
  }
}
