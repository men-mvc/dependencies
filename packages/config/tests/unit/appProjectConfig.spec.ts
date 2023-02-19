import { stub, SinonStub } from 'sinon';
import { faker } from '@faker-js/faker';
import * as path from 'path';
import * as utilities from '../../src/utilities';
import { AppProjectConfig } from '../../src/appProjectConfig';
import { BaseConfig, appProjectConfigDir } from '../../src';
import {
  mockGetAppEnv,
  mockGetAppProjectConfigDirectory,
  mockGetEnvVariables
} from './testUtilities';

const testEnvVariables = {
  SERVER_PORT: '4575',
  AUTH_TOKEN_SECRET_KEY: 'override-auth-secret',
  MAIL_USER: 'test-env-var-user',
  MAIL_PASSWORD: 'test-env-password'
};
const testDefaultConfigJson = require('./envConfigs/default.json');
const testStagingConfigJson = require('./envConfigs/staging.json');
const testConfigDirectory = path.join(__dirname, appProjectConfigDir);
const instance = new AppProjectConfig();

interface FullConfig extends BaseConfig {
  additionalConfig: {
    orderStatus: {
      pending: number;
      confirmed: number;
      delivered: number;
    };
    apiKeys: {
      key: string;
      secret: string;
    }[];
  };
  envVariables: {
    stringVar: string;
    numberVar: number;
    stringArrayVar: string[];
    numberArrayVar: number[];
    nested: {
      stringVar: string;
      numberVar: number;
      stringArrayVar: string[];
      numberArrayVar: number[];
    };
  };
  invalidEnvVariables: {
    nameIsEmpty?: string;
    typeIsUndefined?: unknown;
    invalidTypeValue?: unknown;
  };
}

describe(`AppProjectConfig`, () => {
  let getAppProjectConfigDirectoryStub: SinonStub;
  let getAppEnvStub: SinonStub;
  let getConfigKeyEnvVarNameMappingsStub: SinonStub;
  let getAppProjectDefaultConfigStub: SinonStub;
  let getEnvVariablesStub: SinonStub;

  beforeAll(
    () =>
      (getAppProjectConfigDirectoryStub =
        mockGetAppProjectConfigDirectory(testConfigDirectory))
  );

  afterAll(() => getAppProjectConfigDirectoryStub.restore());

  afterEach(() => {
    if (getAppEnvStub) {
      getAppEnvStub.restore();
    }
    if (getConfigKeyEnvVarNameMappingsStub) {
      getConfigKeyEnvVarNameMappingsStub.restore();
    }
    if (getAppProjectDefaultConfigStub) {
      getAppProjectDefaultConfigStub.restore();
    }
    if (getEnvVariablesStub) {
      getEnvVariablesStub.restore();
    }
  });

  describe(`getConfig`, () => {
    it(`should only return default config values in default.json file when other config files/ variables are missing`, () => {
      getAppEnvStub = mockGetAppEnv(`somewhere`); // does not exist - no env-specific JSON config file
      getConfigKeyEnvVarNameMappingsStub = mockGetConfigKeyEnvVarNameMappings(
        new Map<string, string>()
      ); // ensure that there is no env variables
      assertDefaultOnlyConfig(instance.getConfig<BaseConfig>());
    });

    it(`should only return env-specific config values when other config files/ variables are missing`, () => {
      getAppEnvStub = mockGetAppEnv(`staging`);
      getAppProjectDefaultConfigStub = mockGetAppProjectDefaultConfig({}); // mock the default.json file to be missing
      getConfigKeyEnvVarNameMappingsStub = mockGetConfigKeyEnvVarNameMappings(
        new Map<string, string>()
      ); // ensure that there is no env variables
      assertStagingOnlyConfig(instance.getConfig<BaseConfig>());
    });

    it(`should only return the values of the .env variables when the other config files/ variables are missing`, () => {
      getAppEnvStub = mockGetAppEnv(`somewhere`); // ensure that env specific JSON config file does not exist
      getAppProjectDefaultConfigStub = mockGetAppProjectDefaultConfig({}); // mock the default.json file to be missing
      getEnvVariablesStub = mockGetEnvVariables(testEnvVariables);
      assertEnvVariablesOnlyConfig(instance.getConfig<BaseConfig>());
    });

    it(`should return config values of default.json, env-specific JSON config file and .env variables by merging them in the right order`, () => {
      getAppEnvStub = mockGetAppEnv(`staging`);
      getEnvVariablesStub = mockGetEnvVariables(testEnvVariables);
      assertAllConfigVarsGetMergedTogether(instance.getConfig<BaseConfig>());
    });

    it(`should return empty object when empty object when the ${appProjectConfigDir} folder is missing`, () => {
      getAppProjectConfigDirectoryStub.restore();
      getAppProjectConfigDirectoryStub =
        mockGetAppProjectConfigDirectory(`does-not-exists`);

      const result = instance.getConfig<BaseConfig>();
      expect(typeof result === 'object').toBeTruthy();
      expect(Object.keys(result).length).toBe(0);

      getAppProjectConfigDirectoryStub.restore();
      getAppProjectConfigDirectoryStub =
        mockGetAppProjectConfigDirectory(testConfigDirectory);
    });

    it(`should not override the config variable with the .env variable when the .env variable value is null/ undefined`, () => {
      getAppEnvStub = mockGetAppEnv(`staging`);
      getEnvVariablesStub = mockGetEnvVariables({
        ...testEnvVariables,
        MAIL_USER: undefined
      });
      const actualConfig = instance.getConfig<BaseConfig>();

      expect(actualConfig.mail.user).toBe(testStagingConfigJson.mail.user);
    });

    it(`should allow to define complex array value in JSON config files`, () => {
      getAppEnvStub = mockGetAppEnv(`staging`);
      const actualConfig = instance.getConfig<FullConfig>();

      expect(actualConfig.additionalConfig.orderStatus.confirmed).toBe(
        testStagingConfigJson.additionalConfig.orderStatus.confirmed
      );
      expect(actualConfig.additionalConfig.orderStatus.pending).toBe(
        testStagingConfigJson.additionalConfig.orderStatus.pending
      );
      expect(actualConfig.additionalConfig.orderStatus.delivered).toBe(
        testStagingConfigJson.additionalConfig.orderStatus.delivered
      );
      expect(actualConfig.additionalConfig.apiKeys.length).toBe(2);
      actualConfig.additionalConfig.apiKeys.forEach((apiKey, index) => {
        expect(apiKey.key).toBe(
          testStagingConfigJson.additionalConfig.apiKeys[index].key
        );
        expect(apiKey.secret).toBe(
          testStagingConfigJson.additionalConfig.apiKeys[index].secret
        );
      });
    });

    it(`should set config variable with the .env variable value even though the config key for .env variable is neither default.json or env-specific config file`, () => {
      getAppEnvStub = mockGetAppEnv(`somewhere`);
      getAppProjectDefaultConfigStub = mockGetAppProjectDefaultConfig({}); // mock the default.json file to be missing
      getEnvVariablesStub = mockGetEnvVariables(testEnvVariables);
      const actualConfig = instance.getConfig<BaseConfig>();
      expect(actualConfig.server.port).toBe(testEnvVariables.SERVER_PORT);
    });

    it(`should declare the .env variable as string`, () => {
      getAppEnvStub = mockGetAppEnv(`somewhere`);
      getAppProjectDefaultConfigStub = mockGetAppProjectDefaultConfig({}); // mock the default.json file to be missing
      const mockVariables = {
        ...testEnvVariables,
        STRING_VAR: faker.lorem.sentence()
      };
      getEnvVariablesStub = mockGetEnvVariables(mockVariables);
      const actualConfig = instance.getConfig<FullConfig>();

      expect(actualConfig.envVariables.stringVar).toBe(
        mockVariables.STRING_VAR
      );
    });

    it(`should declare the nested .env variable as string`, () => {
      getAppEnvStub = mockGetAppEnv(`somewhere`);
      getAppProjectDefaultConfigStub = mockGetAppProjectDefaultConfig({}); // mock the default.json file to be missing
      const mockVariables = {
        ...testEnvVariables,
        NESTED_STRING_VAR: faker.lorem.sentence()
      };
      getEnvVariablesStub = mockGetEnvVariables(mockVariables);
      const actualConfig = instance.getConfig<FullConfig>();

      expect(actualConfig.envVariables.nested.stringVar).toBe(
        mockVariables.NESTED_STRING_VAR
      );
    });

    it(`should declare the .env variable as number`, () => {
      getAppEnvStub = mockGetAppEnv(`somewhere`);
      getAppProjectDefaultConfigStub = mockGetAppProjectDefaultConfig({}); // mock the default.json file to be missing
      const mockVariables = {
        ...testEnvVariables,
        NUMBER_VAR: faker.random.numeric().toString()
      };
      getEnvVariablesStub = mockGetEnvVariables(mockVariables);
      const actualConfig = instance.getConfig<FullConfig>();

      expect(actualConfig.envVariables.numberVar).toBe(
        Number(mockVariables.NUMBER_VAR)
      );
      expect(
        typeof actualConfig.envVariables.numberVar === 'number'
      ).toBeTruthy();
    });

    it(`should declare the nested .env variable as number`, () => {
      getAppEnvStub = mockGetAppEnv(`somewhere`);
      getAppProjectDefaultConfigStub = mockGetAppProjectDefaultConfig({}); // mock the default.json file to be missing
      const mockVariables = {
        ...testEnvVariables,
        NESTED_NUMBER_VAR: faker.random.numeric().toString().toString()
      };
      getEnvVariablesStub = mockGetEnvVariables(mockVariables);
      const actualConfig = instance.getConfig<FullConfig>();

      expect(actualConfig.envVariables.nested.numberVar).toBe(
        Number(mockVariables.NESTED_NUMBER_VAR)
      );
      expect(
        typeof actualConfig.envVariables.nested.numberVar === 'number'
      ).toBeTruthy();
    });

    it(`should declare the .env variable as string array`, () => {
      const stringArray = [faker.lorem.word(), faker.lorem.word()];
      getAppEnvStub = mockGetAppEnv(`somewhere`);
      getAppProjectDefaultConfigStub = mockGetAppProjectDefaultConfig({}); // mock the default.json file to be missing
      const mockVariables = {
        ...testEnvVariables,
        STRING_ARRAY_VAR: stringArray.join(',')
      };
      getEnvVariablesStub = mockGetEnvVariables(mockVariables);
      const actualConfig = instance.getConfig<FullConfig>();

      expect(actualConfig.envVariables.stringArrayVar.length).toBe(
        stringArray.length
      );
      stringArray.forEach((envValue, index) => {
        expect(actualConfig.envVariables.stringArrayVar[index]).toBe(envValue);
        expect(
          typeof actualConfig.envVariables.stringArrayVar[index] === 'string'
        ).toBeTruthy();
      });
    });

    it(`should declare the nested .env variable as string array`, () => {
      const stringArray = [faker.lorem.word(), faker.lorem.word()];
      getAppEnvStub = mockGetAppEnv(`somewhere`);
      getAppProjectDefaultConfigStub = mockGetAppProjectDefaultConfig({}); // mock the default.json file to be missing
      const mockVariables = {
        ...testEnvVariables,
        NESTED_STRING_ARRAY_VAR: stringArray.join(',')
      };
      getEnvVariablesStub = mockGetEnvVariables(mockVariables);
      const actualConfig = instance.getConfig<FullConfig>();

      expect(actualConfig.envVariables.nested.stringArrayVar.length).toBe(
        stringArray.length
      );
      stringArray.forEach((envValue, index) => {
        expect(actualConfig.envVariables.nested.stringArrayVar[index]).toBe(
          envValue
        );
        expect(
          typeof actualConfig.envVariables.nested.stringArrayVar[index] ===
            'string'
        ).toBeTruthy();
      });
    });

    it(`should declare the .env variable as number array`, () => {
      const numberArray = [
        faker.random.numeric().toString(),
        faker.random.numeric().toString()
      ];
      getAppEnvStub = mockGetAppEnv(`somewhere`);
      getAppProjectDefaultConfigStub = mockGetAppProjectDefaultConfig({}); // mock the default.json file to be missing
      const mockVariables = {
        ...testEnvVariables,
        NUMBER_ARRAY_VAR: numberArray.join(',')
      };
      getEnvVariablesStub = mockGetEnvVariables(mockVariables);
      const actualConfig = instance.getConfig<FullConfig>();

      expect(actualConfig.envVariables.numberArrayVar.length).toBe(
        numberArray.length
      );
      numberArray.forEach((envValue, index) => {
        expect(actualConfig.envVariables.numberArrayVar[index]).toBe(
          Number(envValue)
        );
        expect(
          typeof actualConfig.envVariables.numberArrayVar[index] === 'number'
        ).toBeTruthy();
      });
    });

    it(`should declare the nested .env variable as number array`, () => {
      const numberArray = [
        faker.random.numeric().toString(),
        faker.random.numeric().toString()
      ];
      getAppEnvStub = mockGetAppEnv(`somewhere`);
      getAppProjectDefaultConfigStub = mockGetAppProjectDefaultConfig({}); // mock the default.json file to be missing
      const mockVariables = {
        ...testEnvVariables,
        NESTED_NUMBER_ARRAY_VAR: numberArray.join(',')
      };
      getEnvVariablesStub = mockGetEnvVariables(mockVariables);
      const actualConfig = instance.getConfig<FullConfig>();

      expect(actualConfig.envVariables.nested.numberArrayVar.length).toBe(
        numberArray.length
      );
      numberArray.forEach((envValue, index) => {
        expect(actualConfig.envVariables.nested.numberArrayVar[index]).toBe(
          Number(envValue)
        );
        expect(
          typeof actualConfig.envVariables.nested.numberArrayVar[index] ===
            'number'
        ).toBeTruthy();
      });
    });

    it(`should not consider the declaration as valid when the name prop is empty string`, () => {
      getAppEnvStub = mockGetAppEnv(`somewhere`);
      getAppProjectDefaultConfigStub = mockGetAppProjectDefaultConfig({}); // mock the default.json file to be missing
      const mockVariables = {
        ...testEnvVariables,
        '': ''
      };
      getEnvVariablesStub = mockGetEnvVariables(mockVariables);
      const actualConfig = instance.getConfig<FullConfig>();

      expect(actualConfig.invalidEnvVariables?.nameIsEmpty).toBeUndefined();
    });

    it(`should not consider the declaration as valid when the type is not defined`, () => {
      getAppEnvStub = mockGetAppEnv(`somewhere`);
      getAppProjectDefaultConfigStub = mockGetAppProjectDefaultConfig({}); // mock the default.json file to be missing
      const mockVariables = {
        TYPE_IS_UNDEFINED: 'test-string'
      };
      getEnvVariablesStub = mockGetEnvVariables(mockVariables);
      const actualConfig = instance.getConfig<FullConfig>();

      expect(
        JSON.stringify(actualConfig.invalidEnvVariables?.typeIsUndefined)
      ).toBe(JSON.stringify({ name: mockVariables.TYPE_IS_UNDEFINED }));
    });

    it(`should not consider the declaration as valid when the type value is invalid`, () => {
      getAppEnvStub = mockGetAppEnv(`somewhere`);
      getAppProjectDefaultConfigStub = mockGetAppProjectDefaultConfig({}); // mock the default.json file to be missing
      const mockVariables = {
        INVALID_TYPE_VALUE: 'test-string'
      };
      getEnvVariablesStub = mockGetEnvVariables(mockVariables);
      const actualConfig = instance.getConfig<FullConfig>();

      expect(JSON.stringify(actualConfig.invalidEnvVariables.invalidTypeValue)).toBe(JSON.stringify({name: mockVariables.INVALID_TYPE_VALUE}));
    });
  });

  const mockGetConfigKeyEnvVarNameMappings = (
    returnValue: Map<string, string>
  ): SinonStub => {
    const subjectFuncStub = stub(utilities, `getConfigKeyEnvVarNameMappings`);
    return subjectFuncStub.callsFake(jest.fn().mockReturnValue(returnValue));
  };

  const mockGetAppProjectDefaultConfig = (
    fakeConfig: Record<string, unknown>
  ): SinonStub => {
    const subjectFuncStub = stub(instance, `getAppProjectDefaultConfig`);
    return subjectFuncStub.callsFake(jest.fn().mockReturnValue(fakeConfig));
  };

  const assertDefaultOnlyConfig = (actualConfig: BaseConfig) => {
    expect(actualConfig.app.name).toBe(testDefaultConfigJson.app.name);
    expect(actualConfig.server.port).toBe(testDefaultConfigJson.server.port);
    expect(actualConfig.auth.secret).toBe(testDefaultConfigJson.auth.secret);
    expect(actualConfig.auth.tokenExpiresIn).toBe(
      testDefaultConfigJson.auth.tokenExpiresIn
    );
    expect(actualConfig.auth.emailVerificationLinkDuration).toBe(
      testDefaultConfigJson.auth.emailVerificationLinkDuration
    );
    expect(actualConfig.auth.passwordResetLinkDuration).toBe(
      testDefaultConfigJson.auth.passwordResetLinkDuration
    );
    expect(actualConfig.mail.driver).toBe(testDefaultConfigJson.mail.driver);
    expect(actualConfig.mail.user).toBe(testDefaultConfigJson.mail.user);
    expect(actualConfig.mail.password).toBe(
      testDefaultConfigJson.mail.password
    );
    expect(actualConfig.mail.host).toBe(testDefaultConfigJson.mail.host);
    expect(actualConfig.mail.port).toBe(testDefaultConfigJson.mail.port);
    expect(actualConfig.mail.service).toBe(testDefaultConfigJson.mail.service);
    expect(actualConfig.cache.driver).toBe(testDefaultConfigJson.cache.driver);
    expect(actualConfig.cache.redis?.port).toBe(
      testDefaultConfigJson.cache.redis.port
    );
    expect(actualConfig.cache.redis?.host).toBe(
      testDefaultConfigJson.cache.redis.host
    );
    expect(actualConfig.cache.redis?.database).toBe(
      testDefaultConfigJson.cache.redis?.database
    );
    expect(actualConfig.cache.redis?.password).toBe(
      testDefaultConfigJson.cache.redis?.password
    );
    expect(actualConfig.fileSystem?.storageDriver).toBe(
      testDefaultConfigJson.fileSystem.storageDriver
    );
    expect(actualConfig.fileSystem?.maxUploadLimit).toBe(
      testDefaultConfigJson.fileSystem.maxUploadLimit
    );
  };

  const assertStagingOnlyConfig = (actualConfig: BaseConfig) => {
    expect(actualConfig.app.name).toBe(testStagingConfigJson.app.name);
    expect(actualConfig.server.port).toBe(testStagingConfigJson.server.port);
    expect(actualConfig.mail.user).toBe(testStagingConfigJson.mail.user);
    expect(actualConfig.mail.password).toBe(
      testStagingConfigJson.mail.password
    );
    expect(actualConfig.cache.redis?.host).toBe(
      testStagingConfigJson.cache.redis.host
    );
    expect(actualConfig.cache.redis?.port).toBe(
      testStagingConfigJson.cache.redis.port
    );
    expect(actualConfig.cache.redis?.password).toBe(
      testStagingConfigJson.cache.redis.password
    );
    expect(actualConfig.cache.redis?.database).toBe(
      testStagingConfigJson.cache.redis.database
    );

    /**
     * ensure that props from the default.json are not merged in
     * for staging, fileSystem section is not overridden
     */
    expect(actualConfig.fileSystem).toBeUndefined();
  };

  const assertEnvVariablesOnlyConfig = (actualConfig: BaseConfig) => {
    expect(actualConfig.server.port).toBe(testEnvVariables.SERVER_PORT);
    expect(actualConfig.auth.secret).toBe(
      testEnvVariables.AUTH_TOKEN_SECRET_KEY
    );
    expect(actualConfig.mail.user).toBe(testEnvVariables.MAIL_USER);
    expect(actualConfig.mail.password).toBe(testEnvVariables.MAIL_PASSWORD);
    // ensure that default and env-specific does not override
    expect(actualConfig.fileSystem).toBeUndefined();
  };

  const assertAllConfigVarsGetMergedTogether = (actualConfig: BaseConfig) => {
    expect(actualConfig.app.name).toBe(testStagingConfigJson.app.name);
    expect(actualConfig.server.port).toBe(testEnvVariables.SERVER_PORT);
    expect(actualConfig.auth.secret).toBe(
      testEnvVariables.AUTH_TOKEN_SECRET_KEY
    );
    expect(actualConfig.auth.tokenExpiresIn).toBe(
      testDefaultConfigJson.auth.tokenExpiresIn
    );
    expect(actualConfig.auth.passwordResetLinkDuration).toBe(
      testDefaultConfigJson.auth.passwordResetLinkDuration
    );
    expect(actualConfig.auth.emailVerificationLinkDuration).toBe(
      testDefaultConfigJson.auth.emailVerificationLinkDuration
    );
    expect(actualConfig.mail.driver).toBe(testDefaultConfigJson.mail.driver);
    expect(actualConfig.mail.user).toBe(testEnvVariables.MAIL_USER);
    expect(actualConfig.mail.password).toBe(testEnvVariables.MAIL_PASSWORD);
    expect(actualConfig.mail.host).toBe(testDefaultConfigJson.mail.host);
    expect(actualConfig.mail.port).toBe(testDefaultConfigJson.mail.port);
    expect(actualConfig.mail.service).toBe(testDefaultConfigJson.mail.service);
    expect(actualConfig.cache.driver).toBe(testDefaultConfigJson.cache.driver);
    expect(actualConfig.cache.redis?.port).toBe(
      testStagingConfigJson.cache.redis.port
    );
    expect(actualConfig.cache.redis?.host).toBe(
      testDefaultConfigJson.cache.redis.host
    );
    expect(actualConfig.cache.redis?.password).toBe(
      testDefaultConfigJson.cache.redis.password
    );
    expect(actualConfig.cache.redis?.database).toBe(
      testDefaultConfigJson.cache.redis.database
    );
    expect(actualConfig.fileSystem?.storageDriver).toBe(
      testDefaultConfigJson.fileSystem.storageDriver
    );
    expect(actualConfig.fileSystem?.maxUploadLimit).toBe(
      testDefaultConfigJson.fileSystem.maxUploadLimit
    );
  };
});
