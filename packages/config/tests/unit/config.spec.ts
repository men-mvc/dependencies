import sinon from 'sinon';
import path from 'path';
import * as utilities from '../../src/utilities';
import { Config } from '../../src/config';
import { appConfigUtility } from '../../src/appConfigUtility';
import { coreTestConfig } from '../../src/globals';

describe(`Config`, () => {
  describe(`getInstance`, () => {
    let getAppEnvStub: sinon.SinonStub;
    let isRunningCoreTestsStub: sinon.SinonStub;
    let getAppLevelConfigDirStub: sinon.SinonStub;
    beforeEach(() => {
      Config.resetConfig();
    });
    afterEach(() => {
      if (getAppEnvStub) {
        getAppEnvStub.restore();
      }
      if (isRunningCoreTestsStub) {
        isRunningCoreTestsStub.restore();
      }
      if (getAppLevelConfigDirStub) {
        getAppLevelConfigDirStub.restore();
      }
    });
    it(`should return core test config when core test is running`, () => {
      mockIsRunningCoreTests(true);
      const config = Config.getConfig();
      expect(JSON.stringify(config)).toBe(JSON.stringify(coreTestConfig));
    });

    it(`should return app-level config when it is not running core tests`, () => {
      const expectedConfigJson = require('./fakeConfigs/staging.json');
      mockIsRunningCoreTests(false);
      mockGetAppEnv(`staging`);
      mockAppLevelConfigDir();
      const config = Config.getConfig();

      expect(JSON.stringify(config)).toBe(JSON.stringify(expectedConfigJson));
    });

    it(`should return the same instance`, () => {
      mockIsRunningCoreTests(true);
      const config1 = Config.getConfig();
      const config2 = Config.getConfig();
      expect(config1).toBe(config2);
    });

    const mockIsRunningCoreTests = (value: boolean) => {
      isRunningCoreTestsStub = sinon.stub(utilities, `isRunningCoreTests`);
      isRunningCoreTestsStub.returns(value);
    };

    const mockGetAppEnv = (env: string) => {
      getAppEnvStub = sinon.stub(utilities, `getAppEnv`);
      getAppEnvStub.returns(env);
    };

    const mockAppLevelConfigDir = () => {
      getAppLevelConfigDirStub = sinon.stub(
        appConfigUtility,
        `_getAppLevelConfigDir`
      );
      getAppLevelConfigDirStub.returns(path.join(__dirname, `fakeConfigs`));
    };
  });
});
