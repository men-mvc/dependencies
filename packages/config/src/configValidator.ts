import {
  BaseConfig,
  CacheDriver,
  FileSystemDriver,
  MailAuthType,
  MailDriver
} from './types';
import { isTestEnvironment } from './utilities';

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
          this.config.fileSystem.storageDriver?.toString().toLowerCase()
      );
  };

  // TODO: finish
  // checking if the driver is s3 is already done before calling this function
  private validateS3FileSystemConfig = (): boolean => {
    if (!this.config.fileSystem?.s3) {
      throw new Error(`AWS credentials are not set for s3 filesystem driver.`);
    }

    return true;
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
    if (this.hasValidFileSystemDriver()) {
      // if this.config.fileSystem?.storageDriver is undefined is already checked by hasValidFileSystemDriver funciton
      if (
        isTestEnvironment() &&
        this.config.fileSystem?.storageDriver !== FileSystemDriver.local
      ) {
        throw new Error(`Tests only support local filesystem driver.`);
      }
      if (this.config.fileSystem?.storageDriver === FileSystemDriver.s3) {
        // TODO: validate the S3 credentials
      }
    } else {
      throw new Error(`Invalid file system storage driver.`);
    }
  };
}
