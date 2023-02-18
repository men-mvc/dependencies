import fs from 'fs';
import * as path from 'path';
import _, { isNil } from 'lodash';
import { ConfigContract } from './configContract';
import {
  getAppEnv,
  getAppProjectConfigDirectory,
  getConfigKeyEnvVarNameMappings,
  getEnvVariable
} from './utilities';
import * as console from 'console';

// TODO: add type casting support for .env variables.
export class AppProjectConfig implements ConfigContract {
  public getAppProjectDefaultConfig = (): Record<string, unknown> => {
    const appProjectConfigDir = getAppProjectConfigDirectory();
    if (!appProjectConfigDir) {
      return {};
    }

    let appProjectConfigFilePath = path.join(
      appProjectConfigDir,
      `default.json`
    );
    if (fs.existsSync(appProjectConfigFilePath)) {
      const defaultConfig = require(appProjectConfigFilePath);
      if (defaultConfig) {
        return defaultConfig as Record<string, unknown>;
      }
    }

    return {};
  };

  private getAppProjectEnvSpecificConfig = (): Record<string, unknown> => {
    const appProjectConfigDir = getAppProjectConfigDirectory();
    if (!appProjectConfigDir) {
      // config directory not found in the app project.
      return {};
    }
    const nodeEnv = getAppEnv();
    const appProjectConfigFilePath = path.join(
      appProjectConfigDir,
      `${nodeEnv}.json`
    );

    if (fs.existsSync(appProjectConfigFilePath)) {
      const envSpecificConfig = require(appProjectConfigFilePath);
      if (envSpecificConfig) {
        return envSpecificConfig as Record<string, unknown>;
      }
    }

    return {};
  };

  private getAppProjectConfig = (): Record<string, unknown> =>
    _.merge(
      this.getAppProjectDefaultConfig(),
      this.getAppProjectEnvSpecificConfig()
    );

  private getAppProjectConfigKeyEnvVarMappings = (): Map<string, string> => {
    const appProjectConfigDir = getAppProjectConfigDirectory();
    if (!appProjectConfigDir) {
      // config directory not found in the app project.
      return new Map<string, string>();
    }

    const envVariablesConfigFilePath = path.join(
      appProjectConfigDir,
      `env-variables.json`
    );

    if (fs.existsSync(envVariablesConfigFilePath)) {
      const envVariablesConfig = require(envVariablesConfigFilePath);
      if (envVariablesConfig) {
        return getConfigKeyEnvVarNameMappings(envVariablesConfig);
      }
    }

    return new Map<string, string>();
  };

  public getConfig = <T>(): T => {
    const appProjectConfig = this.getAppProjectConfig();
    const configKeyEnvVarMappings = this.getAppProjectConfigKeyEnvVarMappings();

    /**
     * replace the config value from .json file with the value of the .env variable.
     * but only replace when the env variable value is null or undefined.
     */
    configKeyEnvVarMappings.forEach((value, key) => {
      const envVarValue = getEnvVariable(value, undefined);
      if (isNil(envVarValue)) {
        return;
      }
      _.set(appProjectConfig, key, envVarValue);
    });

    return appProjectConfig as T;
  };
}
