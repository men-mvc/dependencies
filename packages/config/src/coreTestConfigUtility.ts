import { BaseConfigUtility } from './baseConfigUtility';
import { BaseConfig } from './baseConfig';
import { coreTestConfig } from './globals';

export class CoreTestConfigUtility extends BaseConfigUtility {
  // TODO: test singleton
  public getConfig = (): BaseConfig => {
    if (!CoreTestConfigUtility.config) {
      CoreTestConfigUtility.config = coreTestConfig;
    }

    return CoreTestConfigUtility.config;
  };
}

let instance: CoreTestConfigUtility;
const getInstance = (): CoreTestConfigUtility => {
  if (!instance) {
    instance = new CoreTestConfigUtility();
  }

  return instance;
};

export const coreTestConfigUtility: CoreTestConfigUtility = getInstance();
