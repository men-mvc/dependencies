import sinon, { SinonStub } from 'sinon';
import fs from 'fs';
import path from 'path';
import {
  appConfigUtility,
  BaseConfig,
  CONFIG_VARIABLES_COUNT
} from '../../src';
import * as utilities from '../../src/utilities';

const stagingConfigJson = require('./fakeConfigs/staging.json');
const partialStagingConfigJson = require('./fakeConfigs/partial-staging.json');
const defaultConfigJson = require('./fakeConfigs/default.json');
const fakeConfigDirPath = path.join(__dirname, `fakeConfigs`);
const fakeEnvVars = require('./fakeConfigs/env-vars.json');
const completeEnvVars = require('./fakeConfigs/complete-env-vars.json');
describe(`AppConfigUtility`, () => {
  describe(`getConfig`, () => {
    let getAppEnvStub: SinonStub | null;
    let getAppLevelConfigDirStub: SinonStub | null;
    let getEnvVariablesStub: SinonStub | null;
    beforeEach(() => {
      appConfigUtility.resetConfig();
    });
    afterEach(() => {
      if (getAppEnvStub) {
        getAppEnvStub.restore();
      }
      if (getAppLevelConfigDirStub) {
        getAppLevelConfigDirStub.restore();
      }
      if (getEnvVariablesStub) {
        getEnvVariablesStub.restore();
      }
      getAppEnvStub = null;
      getAppLevelConfigDirStub = null;
      getEnvVariablesStub = null;
    });

    it(`should set every prop of the config object with the corresponding .env variable`, () => {
      fakeGetEnvVariables(completeEnvVars);
      assertEachConfigFieldIsOverwrittenByEnvVar(appConfigUtility.getConfig());
    });

    it(`should return empty object when the app level configuration directory does not exist`, () => {
      fakeGetEnvVariables();
      const result = appConfigUtility.getConfig();
      expect(typeof result === 'object').toBeTruthy();
      expect(Object.keys(result).length).toBe(0);
    });

    it(`should return config values of corresponding config json file based on the environment`, () => {
      fakeGetAppEnv(`staging`);
      fakeGetAppLevelConfigDir();
      fakeGetEnvVariables();

      const result = appConfigUtility.getConfig();
      expect(Object.keys(result).length > 0).toBeTruthy();
      expect(JSON.stringify(result)).toBe(JSON.stringify(stagingConfigJson));
    });

    it(`should overwrite default config values with env-specific config values`, () => {
      fakeGetAppEnv(`partial-staging`);
      fakeGetAppLevelConfigDir();
      fakeGetEnvVariables();

      const result = appConfigUtility.getConfig();
      expect(Object.keys(result).length > 0).toBeTruthy();
      expect(result.app.name).toBe(partialStagingConfigJson.app.name);
      expect(result.auth.secret).toBe(partialStagingConfigJson.auth.secret);
      expect(result.auth.tokenExpiresIn).toBe(
        defaultConfigJson.auth.tokenExpiresIn
      );
      expect(result.auth.emailVerificationLinkDuration).toBe(
        defaultConfigJson.auth.emailVerificationLinkDuration
      );
      expect(result.server.port).toBe(parseInt(defaultConfigJson.server.port));
    });

    it(`should return values of default config json file when there is no config file for environment`, () => {
      fakeGetAppEnv(`beta`);
      fakeGetAppLevelConfigDir();
      fakeGetEnvVariables();

      const result = appConfigUtility.getConfig();
      expect(Object.keys(result).length > 0).toBeTruthy();
      expect(JSON.stringify(result)).toBe(JSON.stringify(defaultConfigJson));
    });

    it(`should return empty object when neither default.json or matching env json file exist`, async () => {
      const originalDefaultJsonFilepath = path.join(
        fakeConfigDirPath,
        `default.json`
      );
      const renamedDefaultJsonFilepath = path.join(
        fakeConfigDirPath,
        `default-renamed.json`
      );
      fs.renameSync(originalDefaultJsonFilepath, renamedDefaultJsonFilepath);
      fakeGetAppEnv(`beta`);
      fakeGetAppLevelConfigDir();
      fakeGetEnvVariables();

      const result = appConfigUtility.getConfig();
      expect(typeof result === 'object').toBeTruthy();
      expect(Object.keys(result).length).toBe(0);
      fs.renameSync(renamedDefaultJsonFilepath, originalDefaultJsonFilepath);
    });

    // testing singleton
    it(`should return the same instance when the config value is already initialised`, () => {
      const stagingConfigJsonString = JSON.stringify(stagingConfigJson);
      fakeGetAppEnv(`staging`);
      fakeGetAppLevelConfigDir();
      fakeGetEnvVariables();
      let result = appConfigUtility.getConfig();
      expect(JSON.stringify(result)).toBe(stagingConfigJsonString);
      const originalStagingConfigJsonFilepath = path.join(
        fakeConfigDirPath,
        `staging.json`
      );
      const renamedStagingConfigJsonFilepath = path.join(
        fakeConfigDirPath,
        `staging-copy.json`
      );
      fs.renameSync(
        originalStagingConfigJsonFilepath,
        renamedStagingConfigJsonFilepath
      );
      expect(fs.existsSync(originalStagingConfigJsonFilepath)).toBeFalsy();
      result = appConfigUtility.getConfig();
      expect(JSON.stringify(result)).toBe(stagingConfigJsonString); // result still the same even though the file does not exist.
      fs.renameSync(
        renamedStagingConfigJsonFilepath,
        originalStagingConfigJsonFilepath
      );
    });

    it(`should overwrite the app-level config file values with env vars`, () => {
      fakeGetAppEnv(`staging`); // staging exist
      fakeGetAppLevelConfigDir();
      fakeGetEnvVariables(fakeEnvVars);
      assertConfigUsesEnvVars(appConfigUtility.getConfig());
    });

    it(`should uses env vars when there is no app-level config file exists`, () => {
      fakeGetAppEnv(`beta`); // beta does not exist.
      fakeGetAppLevelConfigDir();
      fakeGetEnvVariables(fakeEnvVars);
      assertConfigUsesEnvVars(appConfigUtility.getConfig());
    });

    it(`should not allow to use non-local filesystem driver for test`, () => {
      try {
        fakeGetAppEnv(`test`); // beta does not exist.
        fakeGetAppLevelConfigDir();
        fakeGetEnvVariables({
          FILESYSTEM_STORAGE_DRIVER: 's3' // tests can only use local
        });
        appConfigUtility.getConfig();
        throw new Error(`Expected error was not thrown.`);
      } catch (e) {
        expect(
          e instanceof Error &&
            e.message === `Tests can only use local filesystem.`
        ).toBeTruthy();
      }
    });

    const fakeGetAppLevelConfigDir = () => {
      getAppLevelConfigDirStub = sinon.stub(
        appConfigUtility,
        `_getAppLevelConfigDir`
      );
      const fakeGetAppLevelConfigDirFunc = jest
        .fn()
        .mockImplementation(() => fakeConfigDirPath);
      getAppLevelConfigDirStub.callsFake(fakeGetAppLevelConfigDirFunc);

      return getAppLevelConfigDirStub;
    };

    const fakeGetAppEnv = (env: string) => {
      getAppEnvStub = sinon.stub(utilities, `getAppEnv`);
      const fakeAppEnvStubFunc = jest.fn().mockImplementation(() => env);
      getAppEnvStub.callsFake(fakeAppEnvStubFunc);
    };

    const fakeGetEnvVariables = (
      envVars: { [key: string]: string | undefined } = {}
    ) => {
      const defaultEnvVars: { [key: string]: string | undefined } = {};
      getEnvVariablesStub = sinon.stub(utilities, `getEnvVariables`);
      const fakeGetEnvVariablesFunc = jest
        .fn()
        .mockImplementation(() => ({ ...defaultEnvVars, ...envVars }));
      getEnvVariablesStub.callsFake(fakeGetEnvVariablesFunc);
    };

    const assertConfigUsesEnvVars = (config: BaseConfig) => {
      expect(Object.keys(config).length > 0).toBeTruthy();
      expect(config.app.name).toBe(fakeEnvVars.APP_NAME);
      expect(config.server.port).toBe(parseInt(fakeEnvVars.SERVER_PORT));
      expect(config.auth.secret).toBe(fakeEnvVars.AUTH_TOKEN_SECRET_KEY);
      expect(config.auth.tokenExpiresIn).toBe(
        fakeEnvVars.AUTH_TOKEN_EXPIRES_IN
      );
      expect(config.auth.passwordResetLinkDuration).toBe(
        parseInt(fakeEnvVars.PASSWORD_RESET_LINK_DURATION)
      );
      expect(config.mail.user).toBe(fakeEnvVars.MAIL_USER);
      expect(config.mail.password).toBe(fakeEnvVars.MAIL_PASSWORD);
      expect(config.mail.host).toBe(fakeEnvVars.MAIL_HOST);
      expect(config.mail.port).toBe(parseInt(fakeEnvVars.MAIL_PORT));
      expect(config.mail.service).toBe(fakeEnvVars.MAIL_SERVICE);
      expect(config.cache.driver).toBe(fakeEnvVars.CACHE_DRIVER);
      expect(config.cache.redis?.host).toBe(fakeEnvVars.REDIS_HOST);
      expect(config.cache.redis?.port).toBe(parseInt(fakeEnvVars.REDIS_PORT));
      expect(config.cache.redis?.database).toBe(
        parseInt(fakeEnvVars.REDIS_DATABASE)
      );
      expect(config.cache.redis?.password).toBe(fakeEnvVars.REDIS_PASSWORD);
      expect(config.fileSystem.storageDriver).toBe(
        fakeEnvVars.FILESYSTEM_STORAGE_DRIVER
      );
      expect(config.fileSystem.maxUploadLimit).toBe(
        parseInt(fakeEnvVars.FILESYSTEM_MAX_UPLOAD_LIMIT)
      );
    };

    const assertEachConfigFieldIsOverwrittenByEnvVar = (config: BaseConfig) => {
      let setConfigFieldCount = 0;
      const assertConfigPropRecursively = (configObject: {
        [key: string]: unknown;
      }) => {
        for (let k in configObject) {
          if (typeof configObject[k] == 'object' && configObject[k] !== null) {
            const child = configObject[k];
            if (typeof child === 'object' || child !== null) {
              assertConfigPropRecursively(child as { [key: string]: unknown });
            }
          } else {
            setConfigFieldCount++;
            expect(
              configObject[k] !== undefined &&
                configObject[k] !== null &&
                configObject[k] !== ''
            ).toBeTruthy();
          }
        }
      };
      assertConfigPropRecursively(
        config as unknown as { [key: string]: unknown }
      );
      expect(setConfigFieldCount).toBe(CONFIG_VARIABLES_COUNT);
    };
  });
});
