import { isRunningFrameworkTests } from './utilities';
import { ConfigContract } from './configContract';
import { FrameworkTestConfig } from './frameworkTestConfig';
import { AppProjectConfig } from './appProjectConfig';
import { ConfigValidator } from './configValidator';
import { BaseConfig } from './types';

export class Config {
  private static config: Record<string, unknown> | null;

  public static getConfig = <T>(): T => {
    if (Config.config) {
      return Config.config as T;
    }

    let config: ConfigContract;
    if (isRunningFrameworkTests()) {
      config = new FrameworkTestConfig();
    } else {
      config = new AppProjectConfig();
    }
    Config.config = config.getConfig<Record<string, unknown>>();
    new ConfigValidator(Config.config as unknown as BaseConfig).validate();

    return Config.config as T;
  };

  public static resetConfig = () => {
    Config.config = null;
  };
}
