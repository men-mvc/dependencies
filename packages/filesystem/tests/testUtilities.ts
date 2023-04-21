import fs from 'fs';
import {
  BaseConfig,
  DeepPartial,
  frameworkTestConfig
} from '@men-mvc/foundation';
import { getStorageDirectory } from '../src';

export const delay = (milliseconds: number = 500): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, milliseconds);
  });
};

export const deleteStorageDirectory = () => {
  if (!fs.existsSync(getStorageDirectory())) {
    return;
  }

  fs.rmdirSync(getStorageDirectory(), {
    recursive: true
  });
};

export const generateBaseConfig = (
  data: DeepPartial<BaseConfig> = {}
): BaseConfig => {
  return {
    ...frameworkTestConfig,
    ...data
  } as BaseConfig;
};
