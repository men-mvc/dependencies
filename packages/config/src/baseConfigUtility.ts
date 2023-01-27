import { BaseConfig } from './baseConfig';
import { getAppEnv } from './utilities';

/**
 * TODO: create validation where the required variables are missing, example, secret key to generate the access token
 */
export abstract class BaseConfigUtility {
  protected static config: BaseConfig | null = null;

  abstract getConfig: () => BaseConfig;

  protected validate = (config: BaseConfig) => {
    if (!config) {
      throw new Error(`Config has not been initialised.`);
    }
    if (
      config.mail?.driver &&
      !['mailer', 'console_log', 'file_log'].includes(config.mail.driver)
    ) {
      throw new Error(`Mail driver is invalid.`);
    }
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
