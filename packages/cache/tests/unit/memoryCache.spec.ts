import { MemoryCache } from '../../src';
import { faker } from '@faker-js/faker';
import { delay } from './utilities';

const memoryCache = new MemoryCache();
const cacheKey = `user`;
describe(`MemoryCache Utility`, () => {
  afterEach(async () => {
    await memoryCache.clear();
  });

  it(`should store and retrieve the data to and from the memory cache`, async () => {
    const data = generateData();
    await memoryCache.store(cacheKey, data);
    const returnedData = await memoryCache.get(cacheKey);

    expect(returnedData).toBe(data);
  });

  it(`should store the data for duration and return null when the cache is expired`, async () => {
    const data = generateData();
    await memoryCache.store(cacheKey, data, 1.5);
    await delay(2000);
    const returnedData = await memoryCache.get(cacheKey);
    expect(returnedData).toBeNull();
  });

  it(`should delete the data based on key excluding others`, async () => {
    const data = generateData();
    await memoryCache.store(`key_1`, data);
    await memoryCache.store(`key_2`, data);
    await memoryCache.delete(`key_2`);
    expect(await memoryCache.get(`key_2`)).toBeNull();
    expect(await memoryCache.get(`key_1`)).toBe(data);
  });

  it(`should replace the existing data when there is already cached data for the key`, async () => {
    const existingData = generateData();
    const newData = generateData();
    await memoryCache.store(cacheKey, existingData);
    await memoryCache.store(cacheKey, newData);
    const returnedData = await memoryCache.get(cacheKey);
    expect(returnedData).toBe(newData);
  });

  it(`should wipe out all the data`, async () => {
    await memoryCache.store(`key_1`, generateData());
    await memoryCache.store(`key_2`, generateData());
    await memoryCache.clear();
    expect(await memoryCache.get(`key_1`)).toBeNull();
    expect(await memoryCache.get(`key_2`)).toBeNull();
  });

  const generateData = () => ({
    name: faker.name.fullName(),
    email: faker.internet.email()
  });
});
