import {
  BaseConfig,
  CacheDriver,
  FileSystemDriver,
  MailAuthType,
  MailDriver
} from './types';
import { getAppEnv } from './utilities';

/**
 * TODO: create validation where the required variables are missing, example, secret key to generate the access token
 */
export abstract class BaseConfigUtility {
  protected static config: BaseConfig | null = null;

  abstract getConfig: () => BaseConfig;

  private hasValidMailAuthType = (config: BaseConfig): boolean => {
    if (!config.mail?.authType) {
      return true;
    }

    return Object.entries(MailAuthType)
      .map((tuple) => tuple[1])
      .some(
        (type) => type.toLowerCase() === config.mail.authType?.toLowerCase()
      );
  };

  private hasValidMailDriver = (config: BaseConfig): boolean => {
    if (!config.mail?.driver) {
      return true;
    }

    return Object.entries(MailDriver)
      .map((tuple) => tuple[1])
      .some(
        (driver) => driver.toLowerCase() === config.mail.driver?.toLowerCase()
      );
  };

  private hasValidCacheDriver = (config: BaseConfig): boolean => {
    if (!config.cache?.driver) {
      return true;
    }

    return Object.entries(CacheDriver)
      .map((tuple) => tuple[1])
      .some((driver) => driver.toLowerCase() === config.cache.driver);
  };

  private hasValidFileSystemDriver = (config: BaseConfig): boolean => {
    if (!config.fileSystem?.storageDriver) {
      return true;
    }

    return Object.entries(FileSystemDriver)
      .map((tuple) => tuple[1])
      .some(
        (driver) =>
          driver.toLowerCase() ===
          config.fileSystem.storageDriver?.toLowerCase()
      );
  };

  protected validate = (config: BaseConfig) => {
    if (!config) {
      throw new Error(`Config has not been initialised.`);
    }
    if (!this.hasValidMailDriver(config)) {
      throw new Error(`Invalid mail driver.`);
    }
    if (!this.hasValidMailAuthType(config)) {
      throw new Error(
        `Mail auth type must be one of ${Object.entries(MailAuthType)
          .map((tuple) => tuple[1])
          .join(', ')}`
      );
    }
    if (!this.hasValidCacheDriver(config)) {
      throw new Error(`Invalid cache driver.`);
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
    } else if (!this.hasValidFileSystemDriver(config)) {
      throw new Error(`Invalid file system storage driver.`);
    }
  };
}
