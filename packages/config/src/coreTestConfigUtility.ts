import { BaseConfigUtility } from './baseConfigUtility';
import { BaseConfig } from './types';
import { coreTestConfig } from './globals';

export class CoreTestConfigUtility extends BaseConfigUtility {
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
