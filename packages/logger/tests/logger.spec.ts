import { createSandbox, SinonSandbox } from 'sinon';
import { LogDriver } from '@men-mvc/config';
import { Logger, ConsoleLogger, SentryLogger, CloudWatchLogger } from '../src';
import { generateBaseConfig } from './testUtilities';
import * as utilities from '../src/utilities';

describe(`Logger`, () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    Logger.resetInstance();
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`getInstance`, () => {
    it(`should return the instance of the console logger`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          logging: {
            driver: LogDriver.console
          }
        })
      );
      expect(Logger.getInstance()).toBeInstanceOf(ConsoleLogger);
    });

    it(`should return the instance of the sentry logger`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          logging: {
            driver: LogDriver.sentry
          }
        })
      );
      expect(Logger.getInstance()).toBeInstanceOf(SentryLogger);
    });

    it(`should return the instance of the cloudwatch logger`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          logging: {
            driver: LogDriver.cloudwatch
          }
        })
      );
      expect(Logger.getInstance()).toBeInstanceOf(CloudWatchLogger);
    });

    it(`should always return the same instance`, () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
});
