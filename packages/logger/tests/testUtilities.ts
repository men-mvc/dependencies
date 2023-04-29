import {
  BaseConfig,
  DeepPartial,
  frameworkTestConfig
} from '@men-mvc/foundation';

export const generateBaseConfig = (
  config: DeepPartial<BaseConfig> = {}
): BaseConfig => {
  return {
    ...frameworkTestConfig,
    ...config
  } as BaseConfig;
};
