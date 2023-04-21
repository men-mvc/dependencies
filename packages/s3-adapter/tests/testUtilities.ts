import {
  BaseConfig,
  DeepPartial,
  frameworkTestConfig
} from '@men-mvc/foundation';

export const generateBaseConfig = (
  data: DeepPartial<BaseConfig> = {}
): BaseConfig => {
  return {
    ...frameworkTestConfig,
    ...data
  } as BaseConfig;
};
