import { Cache } from './cache';
import { CacheContract } from './cacheContract';

export const cache: CacheContract = Cache.getInstance();

export * from './cacheContract';
export * from './cache';
export * from './memoryCache';
export * from './redisCache';
export * from './utilities';
