import { BaseConfig } from './types';
import { coreTestConfigUtility } from './coreTestConfigUtility';
import { appConfigUtility } from './appConfigUtility';
import { isRunningCoreTests } from './utilities';

export class Config {
  private static config: BaseConfig | null = null;

  public static getConfig = (): BaseConfig => {
    if (!Config.config) {
      if (isRunningCoreTests()) {
        Config.config = coreTestConfigUtility.getConfig();
      } else {
        Config.config = appConfigUtility.getConfig();
      }
    }

    return Config.config;
  };

  public static resetConfig = () => {
    Config.config = null;
  };
}
