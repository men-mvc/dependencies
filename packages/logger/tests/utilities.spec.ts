import { createSandbox, SinonSandbox } from 'sinon';
import { LogDriver } from '@men-mvc/config';
import * as utilities from '../src/utilities';
import { generateBaseConfig } from './testUtilities';

describe(`Logger Utilities`, () => {
  let sandbox: SinonSandbox;
  beforeEach(() => {
    sandbox = createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe(`getCloudwatchConfig`, () => {
    it(`should return the values from the config`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          logging: {
            cloudwatch: {
              accessKeyId: `test-access-key-id`,
              secretAccessKey: `test-access-key-secret`,
              region: `eu-west-1`,
              logGroupName: `test-log-group-name`,
              logStreamPrefix: `test-log-stream-prefix`
            }
          }
        })
      );

      const result = utilities.getCloudwatchConfig();
      expect(result.accessKeyId).toBe(`test-access-key-id`);
      expect(result.secretAccessKey).toBe(`test-access-key-secret`);
      expect(result.region).toBe(`eu-west-1`);
      expect(result.logStreamPrefix).toBe(`test-log-stream-prefix`);
      expect(result.logGroupName).toBe(`test-log-group-name`);
    });

    it(`should return the default values`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          logging: {}
        })
      );

      const result = utilities.getCloudwatchConfig();
      expect(result.accessKeyId).toBe(``);
      expect(result.secretAccessKey).toBe(``);
      expect(result.region).toBe(``);
      expect(result.logStreamPrefix).toBe(`men`);
      expect(result.logGroupName).toBe(``);
    });
  });

  describe(`isLoggingDisabled`, () => {
    it(`should return true if logging is disabled`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          logging: {
            disabled: true
          }
        })
      );

      expect(utilities.isLoggingDisabled()).toBeTruthy();
    });

    it(`should return false by default`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          logging: {}
        })
      );

      expect(utilities.isLoggingDisabled()).toBeFalsy();
    });
  });

  describe(`getLogDriver`, () => {
    it(`should return the driver set in the config`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          logging: {
            driver: LogDriver.sentry
          }
        })
      );

      expect(utilities.getLogDriver()).toEqual(LogDriver.sentry);
    });

    it(`should return console by default`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          logging: {}
        })
      );

      expect(utilities.getLogDriver()).toEqual(LogDriver.console);
    });
  });

  describe(`getSentryConfig`, () => {
    it(`should return values from the config`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          logging: {
            sentry: {
              dsn: `https://test-dsn`,
              tracesSampleRate: 0.5
            }
          }
        })
      );

      expect(utilities.getSentryConfig()).toEqual({
        dsn: `https://test-dsn`,
        tracesSampleRate: 0.5
      });
    });

    it(`should return the default values`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          logging: {}
        })
      );

      expect(utilities.getSentryConfig()).toEqual({
        dsn: ``,
        tracesSampleRate: 1.0
      });
    });
  });
});
