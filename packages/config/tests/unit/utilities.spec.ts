import { createSandbox, SinonSandbox } from 'sinon';
import {
  syncEnvVariables,
  getEnvVariable,
  getAppEnv,
  setEnvVariable,
  unsetEnvVariable,
  getEnvVariables,
  clearEnvVarsCache,
  isRunningFrameworkTests
} from '../../src';
import * as utilities from '../../src/utilities';
import * as process from 'process';

const envVariablesBeforeTest = process.env;
describe(`Config utilities`, () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    clearEnvVarsCache();
    syncEnvVariables(envVariablesBeforeTest);
    sandbox.restore();
  });

  describe(`getAppEnv`, () => {
    it(`should return the value in env variable`, () => {
      process.env['NODE_ENV'] = 'test1';
      expect(getAppEnv()).toBe('test1');
    });

    it(`should return local when the NODE_ENV is not set`, () => {
      unsetEnvVariable(`NODE_ENV`);
      expect(getAppEnv()).toBe(`local`);
    });
  });

  describe(`getEnvVariables`, () => {
    it(`should return all the env variables`, () => {
      expect(Object.keys(getEnvVariables()).length).toBe(
        Object.keys(process.env).length
      );
    });

    it(`should be synced with process.env`, () => {
      process.env['TEST_VARIABLE'] = 'testing 1';
      expect(getEnvVariables()['TEST_VARIABLE']).toBe('testing 1');
      process.env['TEST_VARIABLE'] = 'testing 2';
      expect(getEnvVariables()['TEST_VARIABLE']).toBe('testing 2');

      unsetEnvVariable('TEST_VARIABLE');
    });
  });

  describe(`getEnvVariable`, () => {
    it(`should return the env variable's value`, () => {
      process.env['TEST_NAME'] = 'test name';
      expect(getEnvVariable('TEST_NAME')).toBe('test name');

      unsetEnvVariable('TEST_NAME');
    });

    it(`should be synced with process.env`, () => {
      process.env['TEST_NAME'] = 'test name';
      expect(getEnvVariable('TEST_NAME')).toBe('test name');
      process.env['TEST_NAME'] = 'test name 1';
      expect(getEnvVariable('TEST_NAME')).toBe('test name 1');

      unsetEnvVariable('TEST_NAME');
    });

    it(`should return default value when variable is undefined`, () => {
      expect(getEnvVariable('TEST_NAME', 'default name')).toBe('default name');
    });
  });

  describe(`setEnvVariable`, () => {
    it(`should update the env var`, () => {
      setEnvVariable(`TEST_VAR`, `test value`);
      expect(getEnvVariable(`TEST_VAR`)).toBe(`test value`);
    });

    it(`should update process.env`, () => {
      setEnvVariable(`TEST_VAR`, `test value`);
      expect(process.env['TEST_VAR']).toBe(`test value`);
    });
  });

  describe(`unsetEnvVariable`, () => {
    it(`should unset the variable`, () => {
      setEnvVariable(`TEST_NAME`, `test name`);
      expect(getEnvVariable(`TEST_NAME`)).toBe(`test name`);
      unsetEnvVariable(`TEST_NAME`);
      expect(getEnvVariable(`TEST_NAME`)).toBeUndefined();
    });

    it(`should also unset prop of process.env`, () => {
      process.env['TEST_NAME'] = 'test name';
      unsetEnvVariable(`TEST_NAME`);
      expect(process.env['TEST_NAME']).toBeUndefined();
    });
  });

  describe(`isTestEnvironment`, () => {
    it(`should return true`, () => {
      sandbox.stub(utilities, `getAppEnv`).returns(`test`);
      expect(utilities.isTestEnvironment()).toBeTruthy();
    });

    it(`should return false`, () => {
      sandbox.stub(utilities, `getAppEnv`).returns(`dev`);
      expect(utilities.isTestEnvironment()).toBeFalsy();
    });
  });

  describe(`isRunningFrameworkTests`, () => {
    it(`should return true`, () => {
      process.env.CORE_TEST = '1';
      expect(isRunningFrameworkTests()).toBeTruthy();
    });

    it(`should return false`, () => {
      delete process.env.CORE_TEST;
      expect(isRunningFrameworkTests()).toBeFalsy();

      process.env.CORE_TEST = '1';
    });
  });

  describe(`syncEnvVariables`, () => {
    it(`should set the env variables`, () => {
      syncEnvVariables({
        APP_NAME: 'test app name',
        TEST_VARIABLE: 'test variable'
      });

      expect(getEnvVariable('APP_NAME')).toBe(`test app name`);
      expect(getEnvVariable('TEST_VARIABLE')).toBe(`test variable`);
    });
  });
});
