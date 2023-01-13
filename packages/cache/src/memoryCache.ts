import memoryCache from 'memory-cache';
import { CacheContract } from './cacheContract';

export class MemoryCache implements CacheContract {
  public connect = async (): Promise<void> => {
    // Memory cache does not require connection
  };

  public disconnect = async (): Promise<void> => {
    // Memory cache does not require connection
  };

  public get = async <T>(key: string): Promise<T | null> => {
    const value = memoryCache.get(key);

    return value ? (value as T) : null;
  };

  public store = async <T>(
    key: string,
    data: T,
    duration?: number
  ): Promise<void> => {
    memoryCache.put<T>(key, data, duration ? duration * 1000 : undefined);
  };

  public delete = async (key: string): Promise<void> => {
    memoryCache.del(key);
  };

  public clear = async (): Promise<void> => {
    memoryCache.clear();
  };
}
