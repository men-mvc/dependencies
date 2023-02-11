import { BaseConfig } from './types';
import { coreTestConfigUtility } from './coreTestConfigUtility';
import { appConfigUtility } from './appConfigUtility';
import { isRunningCoreTests } from './utilities';

export class Config {
  private static instance: BaseConfig | null = null;

  public static getInstance = (): BaseConfig => {
    if (!Config.instance) {
      if (isRunningCoreTests()) {
        Config.instance = coreTestConfigUtility.getConfig();
      } else {
        Config.instance = appConfigUtility.getConfig();
      }
    }

    return Config.instance;
  };

  public static resetInstance = () => {
    Config.instance = null;
  };
}
