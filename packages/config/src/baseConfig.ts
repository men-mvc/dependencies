import { CacheDriver, FileSystemDriver } from './globals';

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
    address: string;
    password: string;
    host?: string;
    port?: number;
    service?: string;
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
