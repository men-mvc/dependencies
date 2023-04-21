import { CacheDriver } from './cacheDriver';
import { MailConfig } from './mailConfig';
import { FileSystemDriver } from './fileSystemDriver';
import { S3Config } from './s3Config';

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
    s3?: S3Config;
    local?: {
      urlSignerSecret: string;
      signedUrlDurationInSeconds?: number;
    }
  };
  logging?: {
    disabled?: boolean;
  };
}
