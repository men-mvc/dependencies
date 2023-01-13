import { createClient, RedisClientType } from 'redis';
import { config } from '@men-mvc/config';
import { CacheContract } from './cacheContract';

const getRedisOptions = () => {
  return {
    socket: {
      port: config.cache.redis?.port,
      host: config.cache.redis?.host
    },
    password: config.cache.redis?.password,
    database: config.cache.redis?.database
  };
};
export class RedisCache implements CacheContract {
  private redisClient: RedisClientType | null = null;

  public connect = async (): Promise<void> => {
    this.redisClient = createClient(getRedisOptions());
    this.redisClient.on('error', (error) => {
      throw error;
    });
    await this.redisClient.connect();
  };

  public disconnect = async (): Promise<void> => {
    if (!this.redisClient) {
      return;
    }
    await this.redisClient.quit();
  };

  public get = async <T>(key: string): Promise<T | null> => {
    if (!this.redisClient) {
      return null;
    }
    const data = await this.redisClient.get(key);
    return data ? (JSON.parse(data) as T) : null;
  };

  public store = async <T>(
    key: string,
    data: T,
    duration?: number
  ): Promise<void> => {
    if (!this.redisClient) {
      return;
    }
    await this.redisClient.set(key, JSON.stringify(data));
    if (duration) {
      await this.redisClient.expire(key, duration);
    }
  };

  public delete = async (key: string): Promise<void> => {
    if (!this.redisClient) {
      return;
    }
    await this.redisClient.del(key);
  };

  public clear = async (): Promise<void> => {
    await this.redisClient?.flushDb();
  };
}
