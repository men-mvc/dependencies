import { BaseConfig, CacheDriver, FileSystemDriver } from './types';

export const coreTestConfig: BaseConfig = {
  app: {
    name: `Men MVC`
  },
  server: {
    port: 8080
  },
  auth: {
    secret: `test-auth-token-secret-key`,
    tokenExpiresIn: `1y`,
    passwordResetLinkDuration: 60 * 60 * 2,
    emailVerificationLinkDuration: 60 * 60 * 2
  },
  mail: {
    user: `test-mail@test.com`,
    password: `Testing123!`,
    host: `testhost.com`,
    port: 1234,
    service: `TestService`
  },
  cache: {
    driver: CacheDriver.inMemory,
    redis: {
      port: 6379,
      host: `127.0.0.1`,
      password: ``,
      database: 0
    }
  },
  fileSystem: {
    storageDriver: FileSystemDriver.local, // it's always local for tests
    maxUploadLimit: 1000 * 1024 * 512
  }
};

export const srcDirectory = 'src'; // small letters only
export const buildDirectory = 'dist'; // small letters only
