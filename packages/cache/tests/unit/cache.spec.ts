import sinon from 'sinon';
import { CacheDriver } from '@men-mvc/config';
import { Cache, MemoryCache, RedisCache } from '../../src/index';
import * as cacheUtilities from '../../src/utilities';

describe(`Cache Utility`, () => {
  describe(`getInstance`, () => {
    let getCacheDriverStub: sinon.SinonStub;
    beforeEach(() => {
      Cache.resetInstance();
    });
    afterEach(() => {
      getCacheDriverStub.restore();
    });

    it(`should create redis cache instance when the driver is redis`, () => {
      mockGetCacheDriver(CacheDriver.redis);
      const instance = Cache.getInstance();

      expect(instance instanceof RedisCache).toBeTruthy();
    });

    it(`should create in-memory cache instance when the driver is in-memory`, () => {
      mockGetCacheDriver(CacheDriver.inMemory);
      const instance = Cache.getInstance();

      expect(instance instanceof MemoryCache).toBeTruthy();
    });

    it(`should throw error when cache driver type is is invalid`, () => {
      try {
        mockGetCacheDriver(`in-memory11` as CacheDriver);
        Cache.getInstance();

        throw new Error(`Expected error was not thrown`);
      } catch (e) {
        expect(e instanceof Error && e.message).toBe(`Invalid cache driver.`);
      }
    });

    it(`should return the same instance`, () => {
      mockGetCacheDriver(CacheDriver.inMemory);
      const instance1 = Cache.getInstance();
      const instance2 = Cache.getInstance();
      expect(instance1).toBe(instance2);
    });

    const mockGetCacheDriver = (driver: CacheDriver) => {
      getCacheDriverStub = sinon.stub(cacheUtilities, `getCacheDriver`);
      getCacheDriverStub.returns(driver);
    };
  });
});
