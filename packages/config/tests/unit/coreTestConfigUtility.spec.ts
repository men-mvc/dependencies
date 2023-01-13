import { BaseConfig, coreTestConfig } from '../../src';
import { coreTestConfigUtility } from '../../src/coreTestConfigUtility';

describe(`CoreTestConfigUtility`, () => {
  describe(`getConfig`, () => {
    it(`should return the correct config for core tests`, () => {
      const expectedCoreTestConfig: BaseConfig = coreTestConfig;
      const actualConfig = coreTestConfigUtility.getConfig();

      expect(JSON.stringify(actualConfig)).toBe(
        JSON.stringify(expectedCoreTestConfig)
      );
    });
  });
});
