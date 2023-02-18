import _ from 'lodash';
import findUpOne from 'findup-sync';
import { BaseConfig } from './types';
import { appProjectConfigDir } from './globals';
import c from 'config';
import * as console from 'console';

export const getAppEnv = () => getEnvVariable(`NODE_ENV`, `local`);

let envVars: Record<string, string | undefined>;

export const getEnvVariables = () => {
  if (!envVars) {
    envVars = process.env;
  }

  return envVars;
};

export const getEnvVariable = <T>(key: string, defaultValue: T): T => {
  const vars = getEnvVariables();
  return vars[key] ? (vars[key] as T) : defaultValue;
};

export const setEnvVariable = (key: string, value: string): void => {
  if (!envVars) {
    envVars = getEnvVariables();
  }
  envVars[key] = value;
  process.env[key] = value;
};

/**
 * the functions inside this file are available within the core package only
 * TODO: rename this to is running framework tests
 */
export const isRunningCoreTests = (): boolean =>
  process.env.CORE_TEST ? true : false;

/**
 * return the list of config key from a given env-specific JSON config file.. eg, app.name, auth.secretKey, etc
 * @deprecated - TODO: remove this function since this is not used.
 */
export const getConfigKeyList = (
  configJson: Record<string, any>,
  parentKey: string = ''
): string[] => {
  if (!configJson) {
    return [];
  }

  return Object.keys(configJson).reduce((result: string[], key: string) => {
    const currentKey = parentKey ? `${parentKey}.${key}` : key;

    if (typeof configJson[key] === 'object') {
      return result.concat(getConfigKeyList(configJson[key], currentKey));
    } else {
      return result.concat(currentKey);
    }
  }, []);
};

/**
 * // TODO: test.
 * return
 * [
 *    'app.name' => 'APP_NAME',
 *    'auth.secretKey' => 'AUTH_SECRET_KEY'
 * ]
 * @param envVarsConfigJson - imported json of custom-environment-variables.json file in app project
 */
export const getConfigKeyEnvVarNameMappings = (
  envVarsConfigJson: Record<string, unknown>
): Map<string, string> => {
  const maps: Map<string, string> = new Map<string, string>();

  const getKeyEnvVarMappingsRecursively = (
    configObject: Record<string, unknown> | unknown[],
    keyPrefix: string = ``
  ) => {
    if (Array.isArray(configObject)) {
      configObject.forEach((value, index) => {
        const newKeyPrefix = `${keyPrefix}${index}.`;
        getKeyEnvVarMappingsRecursively(value, newKeyPrefix);
      });
    } else if (typeof configObject === 'object' && configObject !== null) {
      for (let key in configObject) {
        const configValue = configObject[key];
        const newKeyPrefix = `${keyPrefix}${key}.`;
        getKeyEnvVarMappingsRecursively(
          configValue as Record<string, unknown> | unknown[],
          newKeyPrefix
        );
      }
    } else {
      const joinedKey = keyPrefix.slice(0, -1); // Remove trailing dot
      maps.set(joinedKey, configObject as string);
    }
  };

  getKeyEnvVarMappingsRecursively(envVarsConfigJson);

  return maps;
};

let cachedAppProjectConfigDir: string | null = null;
export const getAppProjectConfigDirectory = (): string | null => {
  if (cachedAppProjectConfigDir) {
    return cachedAppProjectConfigDir;
  }
  cachedAppProjectConfigDir = findUpOne(appProjectConfigDir);

  return cachedAppProjectConfigDir;
};
