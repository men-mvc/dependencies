import { BaseConfig } from './baseConfig';
import { getAppEnv } from './utilities';

export abstract class BaseConfigUtility {
  protected static config: BaseConfig | null = null;

  abstract getConfig: () => BaseConfig;

  protected validate = (config: BaseConfig) => {
    if (!config) {
      throw new Error(`Config has not been initialised.`);
    }
    // TODO: add test.
    if (config.mail?.authType && config.mail.authType !== 'OAuth2') {
      throw new Error(`Mail auth type can only be "OAuth2".`);
    }
    /**
     * ! add more rules.
     */
    if (
      getAppEnv() === 'test' &&
      config.fileSystem &&
      config.fileSystem.storageDriver !== 'local'
    ) {
      throw new Error(`Tests can only use local filesystem.`);
    }
  };
}
