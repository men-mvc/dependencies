import dotenv from 'dotenv';
dotenv.config();
import findUpOne from 'findup-sync';
import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import { BaseConfig } from './baseConfig';
import { BaseConfigUtility } from './baseConfigUtility';
import { getAppEnv, getEnvVariables } from './utilities';
import { CacheDriver, FileSystemDriver, MailDriver } from './globals';

/**
 * ! throw error when the default storage is not local for test.
 * ! cache the config in the future.
 * TODO: build a mechanism for publishing the config files from this package into the app project.
 */
export class AppConfigUtility extends BaseConfigUtility {
  /**
   * ! test
   */
  public resetConfig = () => {
    AppConfigUtility.config = null;
  };

  public getConfig = (): BaseConfig => {
    if (!AppConfigUtility.config) {
      /**
       * ! cache in the cached file in the future, but do not cache the test env
       */
      this.syncAppLevelConfig();
      this.syncEnvVars();
      if (!AppConfigUtility.config) {
        /**
         * ! add test
         */
        throw new Error(`Unable to sync application-level configuration.`);
      }
      this.validate(AppConfigUtility.config);
    }

    return AppConfigUtility.config;
  };

  _getAppLevelConfigDir = (): string | null => findUpOne(`config`);

  protected syncAppLevelConfig = () => {
    const nodeEnv = getAppEnv();
    if (AppConfigUtility.config) {
      return AppConfigUtility.config;
    }
    const appLevelConfigDir = this._getAppLevelConfigDir();
    if (!appLevelConfigDir) {
      AppConfigUtility.config = {} as BaseConfig;

      return AppConfigUtility.config;
    }
    // pick the default.json values first
    let appLevelConfigFilePath = path.join(appLevelConfigDir, `default.json`);
    if (fs.existsSync(appLevelConfigFilePath)) {
      const defaultConfig = require(appLevelConfigFilePath) as BaseConfig;
      if (defaultConfig) {
        AppConfigUtility.config = defaultConfig;
      }
    }

    // overwrite the values in the default.json file with env-specific config json file.
    appLevelConfigFilePath = path.join(appLevelConfigDir, `${nodeEnv}.json`);
    if (fs.existsSync(appLevelConfigFilePath)) {
      const envSpecificConfig = require(appLevelConfigFilePath) as BaseConfig;
      if (envSpecificConfig) {
        AppConfigUtility.config = _.merge(
          AppConfigUtility.config,
          envSpecificConfig
        );
      }
    }

    if (!AppConfigUtility.config) {
      AppConfigUtility.config = {} as BaseConfig;
    }

    return AppConfigUtility.config;
  };

  protected syncEnvVars = () => {
    if (!AppConfigUtility.config) {
      throw new Error(
        `Config is not initialised using application level config values yet.`
      );
    }
    const envVars = getEnvVariables();
    if (envVars['APP_NAME']) {
      AppConfigUtility.config.app = {
        name: envVars['APP_NAME']
      };
    }

    if (envVars['SERVER_PORT']) {
      AppConfigUtility.config.server = {
        port: Number(envVars['SERVER_PORT'])
      };
    }

    if (
      envVars['AUTH_TOKEN_SECRET_KEY'] ||
      envVars['AUTH_TOKEN_EXPIRES_IN'] ||
      envVars['PASSWORD_RESET_LINK_DURATION'] ||
      envVars['EMAIL_VERIFICATION_LINK_DURATION']
    ) {
      AppConfigUtility.config.auth = AppConfigUtility.config.auth
        ? AppConfigUtility.config.auth
        : {
            secret: ``,
            tokenExpiresIn: ``,
            passwordResetLinkDuration: 0,
            emailVerificationLinkDuration: 0
          };
      if (envVars['AUTH_TOKEN_SECRET_KEY']) {
        AppConfigUtility.config.auth.secret = envVars['AUTH_TOKEN_SECRET_KEY'];
      }
      if (envVars['AUTH_TOKEN_EXPIRES_IN']) {
        AppConfigUtility.config.auth.tokenExpiresIn =
          envVars['AUTH_TOKEN_EXPIRES_IN'];
      }
      if (envVars['PASSWORD_RESET_LINK_DURATION']) {
        AppConfigUtility.config.auth.passwordResetLinkDuration = Number(
          envVars['PASSWORD_RESET_LINK_DURATION']
        );
      }
      if (envVars['EMAIL_VERIFICATION_LINK_DURATION']) {
        AppConfigUtility.config.auth.emailVerificationLinkDuration = Number(
          envVars['EMAIL_VERIFICATION_LINK_DURATION']
        );
      }
    }

    /**
     * ! if none of the mail .env variable is provided, the mail object itself will be null.
     */
    if (
      envVars['MAIL_DRIVER'] ||
      envVars['MAIL_USER'] ||
      envVars['MAIL_PASSWORD'] ||
      envVars['MAIL_HOST'] ||
      envVars['MAIL_PORT'] ||
      envVars['MAIL_SERVICE'] ||
      envVars['MAIL_SECURE'] ||
      envVars['MAIL_AUTH_TYPE'] ||
      envVars['MAIL_TLS_CIPHERS'] ||
      envVars['MAIL_CLIENT_ID'] ||
      envVars['MAIL_CLIENT_SECRET'] ||
      envVars['MAIL_REFRESH_TOKEN'] ||
      envVars['MAIL_ACCESS_TOKEN'] ||
      envVars['MAIL_EXPIRES']
    ) {
      AppConfigUtility.config.mail = AppConfigUtility.config.mail
        ? AppConfigUtility.config.mail
        : {
            user: ``,
            password: ``,
            service: ``
          };
      if (envVars['MAIL_DRIVER']) {
        AppConfigUtility.config.mail.driver = envVars[
          'MAIL_DRIVER'
        ] as MailDriver;
      }
      if (envVars['MAIL_USER']) {
        AppConfigUtility.config.mail.user = envVars['MAIL_USER'];
      }
      if (envVars['MAIL_PASSWORD']) {
        AppConfigUtility.config.mail.password = envVars['MAIL_PASSWORD'];
      }
      if (envVars['MAIL_HOST']) {
        AppConfigUtility.config.mail.host = envVars['MAIL_HOST'];
      }
      if (envVars['MAIL_PORT']) {
        AppConfigUtility.config.mail.port = Number(envVars['MAIL_PORT']);
      }
      if (envVars['MAIL_SERVICE']) {
        AppConfigUtility.config.mail.service = envVars['MAIL_SERVICE'];
      }
      if (envVars['MAIL_SECURE'] !== '') {
        AppConfigUtility.config.mail.secure = Boolean(envVars['MAIL_SECURE']);
      }
      if (envVars['MAIL_AUTH_TYPE']) {
        AppConfigUtility.config.mail.authType = envVars['MAIL_AUTH_TYPE'];
      }
      if (envVars['MAIL_TLS_CIPHERS']) {
        AppConfigUtility.config.mail.tlsCiphers = envVars['MAIL_TLS_CIPHERS'];
      }
      if (envVars['MAIL_CLIENT_ID']) {
        AppConfigUtility.config.mail.clientId = envVars['MAIL_CLIENT_ID'];
      }
      if (envVars['MAIL_CLIENT_SECRET']) {
        AppConfigUtility.config.mail.clientSecret =
          envVars['MAIL_CLIENT_SECRET'];
      }
      if (envVars['MAIL_REFRESH_TOKEN']) {
        AppConfigUtility.config.mail.refreshToken =
          envVars['MAIL_REFRESH_TOKEN'];
      }
      if (envVars['MAIL_ACCESS_TOKEN']) {
        AppConfigUtility.config.mail.accessToken = envVars['MAIL_ACCESS_TOKEN'];
      }
      if (envVars['MAIL_EXPIRES']) {
        AppConfigUtility.config.mail.expires = Number(envVars['MAIL_EXPIRES']);
      }
    }

    if (envVars['CACHE_DRIVER']) {
      AppConfigUtility.config.cache = {
        driver: envVars['CACHE_DRIVER'] as CacheDriver
      };
    }
    if (
      envVars['REDIS_PORT'] ||
      envVars['REDIS_HOST'] ||
      envVars['REDIS_PASSWORD'] ||
      envVars['REDIS_DATABASE']
    ) {
      if (!AppConfigUtility.config.cache) {
        AppConfigUtility.config.cache = {
          driver: `in-memory`
        };
      }
      let redisConfig: {
        port: number;
        host: string;
        password?: string;
        database?: number;
      } = AppConfigUtility.config.cache.redis
        ? AppConfigUtility.config.cache.redis
        : {
            port: 0,
            host: ``
          };
      if (envVars['REDIS_PORT']) {
        redisConfig.port = Number(envVars['REDIS_PORT']);
      }
      if (envVars['REDIS_HOST']) {
        redisConfig.host = envVars['REDIS_HOST'];
      }
      if (envVars['REDIS_PASSWORD']) {
        redisConfig.password = envVars['REDIS_PASSWORD'];
      }
      if (envVars['REDIS_DATABASE']) {
        redisConfig.database = Number(envVars['REDIS_DATABASE']);
      }
      AppConfigUtility.config.cache.redis = redisConfig;
    }

    if (
      envVars['FILESYSTEM_STORAGE_DRIVER'] ||
      envVars['FILESYSTEM_MAX_UPLOAD_LIMIT']
    ) {
      if (!AppConfigUtility.config.fileSystem) {
        AppConfigUtility.config.fileSystem = {
          storageDriver: `local`,
          maxUploadLimit: 0
        };
      }
      if (envVars['FILESYSTEM_STORAGE_DRIVER']) {
        AppConfigUtility.config.fileSystem.storageDriver = envVars[
          'FILESYSTEM_STORAGE_DRIVER'
        ] as FileSystemDriver;
      }
      if (envVars['FILESYSTEM_MAX_UPLOAD_LIMIT']) {
        AppConfigUtility.config.fileSystem.maxUploadLimit = Number(
          envVars['FILESYSTEM_MAX_UPLOAD_LIMIT']
        );
      }
    }
  };
}

let instance: AppConfigUtility;
const getInstance = (): AppConfigUtility => {
  if (!instance) {
    instance = new AppConfigUtility();
  }

  return instance;
};

export const appConfigUtility: AppConfigUtility = getInstance();
