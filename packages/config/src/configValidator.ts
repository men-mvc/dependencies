import {
  BaseConfig,
  CacheDriver,
  FileSystemDriver,
  MailAuthType,
  MailDriver
} from './types';
import { getAppEnv } from './utilities';
import * as console from 'console';

export class ConfigValidator {
  constructor(private config: BaseConfig) {}

  private hasValidMailAuthType = (): boolean => {
    if (!this.config.mail?.authType) {
      return true;
    }

    return Object.entries(MailAuthType)
      .map((tuple) => tuple[1])
      .some(
        (type) =>
          type.toLowerCase() === this.config.mail.authType?.toLowerCase()
      );
  };

  private hasValidMailDriver = (): boolean => {
    if (!this.config.mail?.driver) {
      return true;
    }

    return Object.entries(MailDriver)
      .map((tuple) => tuple[1])
      .some(
        (driver) =>
          driver.toLowerCase() === this.config.mail.driver?.toLowerCase()
      );
  };

  private hasValidCacheDriver = (): boolean => {
    if (!this.config.cache?.driver) {
      return true;
    }

    return Object.entries(CacheDriver)
      .map((tuple) => tuple[1])
      .some((driver) => driver.toLowerCase() === this.config.cache.driver);
  };

  private hasValidFileSystemDriver = (): boolean => {
    if (!this.config.fileSystem?.storageDriver) {
      return true;
    }

    return Object.entries(FileSystemDriver)
      .map((tuple) => tuple[1])
      .some(
        (driver) =>
          driver.toLowerCase() ===
          this.config.fileSystem.storageDriver?.toLowerCase()
      );
  };

  public validate = () => {
    if (!this.hasValidMailDriver()) {
      throw new Error(`Invalid mail driver.`);
    }
    if (!this.hasValidMailAuthType()) {
      throw new Error(
        `Mail auth type must be one of ${Object.entries(MailAuthType)
          .map((tuple) => tuple[1])
          .join(', ')}`
      );
    }
    if (!this.hasValidCacheDriver()) {
      throw new Error(`Invalid cache driver.`);
    }

    /**
     * ! add more rules.
     */
    if (!this.hasValidFileSystemDriver()) {
      // TODO: in the future, when more driver is added, add validation rule that test supports only local driver.
      throw new Error(`Invalid file system storage driver.`);
    }
  };
}
