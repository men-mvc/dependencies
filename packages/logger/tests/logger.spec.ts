import { createSandbox, SinonSandbox } from 'sinon';
import { LogDriver } from '@men-mvc/config';
import { Logger, ConsoleLogger, SentryLogger } from '../src';
import * as utilities from '../src/utilities';
import { generateBaseConfig } from './testUtilities';

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
      const instance = Logger.getInstance();
      expect(instance instanceof ConsoleLogger).toBeTruthy();
    });

    it(`should return the instance of the sentry logger`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          logging: {
            driver: LogDriver.sentry
          }
        })
      );
      const instance = Logger.getInstance();
      expect(instance instanceof SentryLogger).toBeTruthy();
    });

    it(`should return the same instance`, () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
});
