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
      Config.resetInstance();
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
      const config = Config.getInstance();
      expect(JSON.stringify(config)).toBe(JSON.stringify(coreTestConfig));
    });

    it(`should return app-level config when it is not running core tests`, () => {
      const expectedConfigJson = require('./fakeConfigs/staging.json');
      mockIsRunningCoreTests(false);
      mockGetAppEnv(`staging`);
      mockAppLevelConfigDir();
      const config = Config.getInstance();

      expect(JSON.stringify(config)).toBe(JSON.stringify(expectedConfigJson));
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
