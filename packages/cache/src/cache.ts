import { RedisCache } from './redisCache';
import { MemoryCache } from './memoryCache';
import { getCacheDriver } from './utilities';
import { CacheContract } from './cacheContract';

export class Cache {
  private static instance: CacheContract | null;
  public static getInstance = (): CacheContract => {
    if (!Cache.instance) {
      Cache.validate();
      if (getCacheDriver() === 'redis') {
        Cache.instance = new RedisCache();
      } else {
        // default is in-memory cache
        Cache.instance = new MemoryCache();
      }
    }

    return Cache.instance;
  };

  public static resetInstance = (): void => {
    Cache.instance = null;
  };

  private static validate = (): void => {
    const driver = getCacheDriver();
    if (driver !== 'in-memory' && driver !== `redis`) {
      throw new Error(`Invalid cache driver.`);
    }
  };
}
