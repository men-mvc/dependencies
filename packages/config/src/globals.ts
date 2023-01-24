import { BaseConfig } from './baseConfig';
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
    driver: `in-memory`,
    redis: {
      port: 6379,
      host: `127.0.0.1`,
      password: ``,
      database: 0
    }
  },
  fileSystem: {
    storageDriver: `local`, // it's always local for tests
    maxUploadLimit: 1000 * 1024 * 512
  }
};
// TODO: create another package called @men-mvc/types or @men-mvc/globals
export type CacheDriver = 'redis' | 'in-memory';
export type FileSystemDriver = 'local'; // TODO: add more driver in the future
