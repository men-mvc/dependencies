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
