import { CacheDriver, baseConfig } from '@men-mvc/config';

export const getCacheDriver = (): CacheDriver => {
  return baseConfig.cache.driver
    ? (baseConfig.cache.driver as CacheDriver)
    : CacheDriver.inMemory;
};
