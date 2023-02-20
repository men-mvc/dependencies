import { Logger } from '../../../src';
import { ConsoleLogger } from '../../../src/logger/consoleLogger';

describe(`Logger`, () => {
  describe(`getInstance`, () => {
    beforeEach(() => {
      Logger.resetInstance();
    });

    it(`should return the instance of the console logger`, () => {
      const instance = Logger.getInstance();
      expect(instance instanceof ConsoleLogger).toBeTruthy();
    });

    it(`should return the same instance`, () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
});
