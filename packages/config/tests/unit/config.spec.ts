import sinon from 'sinon';
import path from 'path';
import { Config } from '../../src/config';
import { frameworkTestConfig } from '../../src/globals';
import {
  mockGetAppEnv,
  mockGetAppProjectConfigDirectory,
  mockGetEnvVariables,
  mockIsRunningFrameworkTests
} from './testUtilities';
import {
  BaseConfig,
  MailAuthType,
  MailDriver,
  CacheDriver,
  FileSystemDriver,
  appProjectConfigDir
} from '../../src';

const testEnvVarsWithValidEnumValues = {
  MAIL_DRIVER: MailDriver.mail,
  FILESYSTEM_STORAGE_DRIVER: FileSystemDriver.local,
  CACHE_DRIVER: CacheDriver.inMemory,
  MAIL_AUTH_TYPE: 'LOGIN'
};
const testStagingConfig = require('./envConfigs/staging.json');
const testAppProjectConfigDir = path.join(__dirname, appProjectConfigDir);

describe(`Config`, () => {
  describe(`getConfig`, () => {
    let getAppEnvStub: sinon.SinonStub;
    let isRunningCoreTestsStub: sinon.SinonStub;
    let getAppProjectConfigDirectoryStub: sinon.SinonStub;
    let getEnvVariablesStub: sinon.SinonStub;
    beforeEach(() => {
      Config.resetConfig();
    });
    afterEach(() => {
      if (getAppEnvStub) {
        getAppEnvStub.restore();
      }
      if (isRunningCoreTestsStub) {
        isRunningCoreTestsStub.restore();
      }
      if (getAppProjectConfigDirectoryStub) {
        getAppProjectConfigDirectoryStub.restore();
      }
      if (getEnvVariablesStub) {
        getEnvVariablesStub.restore();
      }
    });

    it(`should return framework test config when framework test is running`, () => {
      isRunningCoreTestsStub = mockIsRunningFrameworkTests(true);
      const config = Config.getConfig();
      expect(JSON.stringify(config)).toBe(JSON.stringify(frameworkTestConfig));
    });

    it(`should return app project config when it is not running core tests`, () => {
      isRunningCoreTestsStub = mockIsRunningFrameworkTests(false);
      getAppProjectConfigDirectoryStub = mockGetAppProjectConfigDirectory(
        testAppProjectConfigDir
      );
      getAppEnvStub = mockGetAppEnv(`staging`);
      getEnvVariablesStub = mockGetEnvVariables({});
      const config = Config.getConfig<BaseConfig>();

      expect(config.app.name).toBe(testStagingConfig.app.name);
      expect(config.mail.user).toBe(testStagingConfig.mail.user);
      expect(config.mail.password).toBe(testStagingConfig.mail.password);
    });

    it(`should return the same instance`, () => {
      isRunningCoreTestsStub = mockIsRunningFrameworkTests(true);
      const config1 = Config.getConfig();
      const config2 = Config.getConfig();
      expect(config1).toBe(config2);
    });
  });

  describe(`validation`, () => {
    let getAppEnvStub: sinon.SinonStub;
    let isRunningCoreTestsStub: sinon.SinonStub;
    let getAppProjectConfigDirectoryStub: sinon.SinonStub;
    let getEnvVariablesStub: sinon.SinonStub;

    beforeAll(() => {
      isRunningCoreTestsStub = mockIsRunningFrameworkTests(false);
      getAppEnvStub = mockGetAppEnv(`staging`);
      getAppProjectConfigDirectoryStub = mockGetAppProjectConfigDirectory(
        testAppProjectConfigDir
      );
    });

    afterAll(() => {
      isRunningCoreTestsStub.restore();
      getAppEnvStub.restore();
      getAppProjectConfigDirectoryStub.restore();
    });

    beforeEach(() => {
      Config.resetConfig();
    });

    afterEach(() => {
      if (getEnvVariablesStub) {
        getEnvVariablesStub.restore();
      }
    });

    Object.entries(MailDriver)
      .map((tuple) => tuple[1])
      .forEach((driver) => {
        it(`should allow the mail driver to be set ${driver}`, () => {
          getEnvVariablesStub = mockGetEnvVariables({
            ...testEnvVarsWithValidEnumValues,
            MAIL_DRIVER: driver
          });
          const config = Config.getConfig<BaseConfig>();

          expect(config.mail.driver).toBe(driver);
        });
      });

    it(`should throw error when invalid mail driver is set`, () => {
      getEnvVariablesStub = mockGetEnvVariables({
        ...testEnvVarsWithValidEnumValues,
        MAIL_DRIVER: 'invalid-mail-driver'
      });
      expect(() => {
        Config.getConfig<BaseConfig>();
      }).toThrow(`Invalid mail driver.`);
    });

    Object.entries(FileSystemDriver)
      .map((tuple) => tuple[1])
      .forEach((driver) => {
        it(`should allow file system storage driver value to be ${driver}`, () => {
          getEnvVariablesStub = mockGetEnvVariables({
            ...testEnvVarsWithValidEnumValues,
            FILESYSTEM_STORAGE_DRIVER: driver
          });
          const config = Config.getConfig<BaseConfig>();

          expect(config.fileSystem.storageDriver).toBe(driver);
        });
      });

    it(`should not allow to file system storage driver to be set with invalid value`, () => {
      getEnvVariablesStub = mockGetEnvVariables({
        ...testEnvVarsWithValidEnumValues,
        FILESYSTEM_STORAGE_DRIVER: 's3'
      });
      expect(() => {
        Config.getConfig<BaseConfig>();
      }).toThrow(`Invalid file system storage driver.`);
    });

    Object.entries(MailAuthType)
      .map((tuple) => tuple[0])
      .forEach((expectedAuthType) => {
        it(`should be allowed to set ${expectedAuthType} for mail auth type`, () => {
          getEnvVariablesStub = mockGetEnvVariables({
            ...testEnvVarsWithValidEnumValues,
            MAIL_AUTH_TYPE: expectedAuthType
          });
          const config = Config.getConfig<BaseConfig>();

          expect(config.mail.authType).toBe(expectedAuthType);
        });
      });

    it(`should throw error when invalid auth type value is set`, () => {
      getEnvVariablesStub = mockGetEnvVariables({
        ...testEnvVarsWithValidEnumValues,
        MAIL_AUTH_TYPE: 'invalid-oauth'
      });
      expect(() => {
        Config.getConfig<BaseConfig>();
      }).toThrow(`Mail auth type must be one of OAuth2, Login`);
    });

    Object.entries(CacheDriver)
      .map((tuple) => tuple[1])
      .forEach((driver) => {
        it(`should allow cache driver to be ${driver}`, () => {
          getEnvVariablesStub = mockGetEnvVariables({
            ...testEnvVarsWithValidEnumValues,
            CACHE_DRIVER: driver
          });
          const config = Config.getConfig<BaseConfig>();

          expect(config.cache.driver).toBe(driver);
        });
      });

    it(`should throw invalid cache driver error when invalid value is set`, () => {
      getEnvVariablesStub = mockGetEnvVariables({
        ...testEnvVarsWithValidEnumValues,
        CACHE_DRIVER: `invalid-cache-driver`
      });
      expect(() => {
        Config.getConfig<BaseConfig>();
      }).toThrow(`Invalid cache driver.`);
    });
  });
});
