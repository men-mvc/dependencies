import {
  FrameworkTestConfig,
  BaseConfig,
  frameworkTestConfig
} from '../../src';

describe(`FrameworkTestConfig`, () => {
  describe(`getConfig`, () => {
    it(`should return framework test config`, () => {
      const instance = new FrameworkTestConfig();
      const actualConfig = instance.getConfig<BaseConfig>();

      expect(JSON.stringify(actualConfig)).toBe(
        JSON.stringify(frameworkTestConfig)
      );
    });
  });
});
