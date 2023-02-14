import { CacheDriver, config } from '@men-mvc/config';

export const getCacheDriver = (): CacheDriver => {
  return config.cache.driver
    ? (config.cache.driver as CacheDriver)
    : CacheDriver.inMemory;
};
