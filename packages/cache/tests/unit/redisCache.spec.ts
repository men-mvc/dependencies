import sinon, { SinonSpy, SinonStub } from 'sinon';
import * as redis from 'redis';
import { faker } from '@faker-js/faker';
import { RedisCache } from '../../src';

/**
 * Note: the tests are only testing if the correct functions from the underlying Redis library is invoked
 * as we are trusting the underlying package.
 * By doing so, the tests will not fail when Redis is not installed for the projects that do not use it.
 */
type FakeData = {
  id: string;
  name: string;
  email: string;
};
const cachedData: FakeData = {
  id: faker.datatype.uuid(),
  name: faker.name.fullName(),
  email: faker.internet.email()
};
const mockRedisClient = {
  connect: () => {
    return Promise.resolve();
  },
  on: (errorName: string, listener: (error: Error) => {}) => {},
  set: (key: string, data: string, duration?: number) => {
    return Promise.resolve();
  },
  expire: (key: string, duration: number) => {},
  get: (key: string) => {
    return Promise.resolve(key === `empty` ? `` : JSON.stringify(cachedData));
  },
  del: (key: string) => {},
  flushDb: () => {}
};
const fakeCreateClient = () => mockRedisClient;
const cache = new RedisCache();
describe(`RedisCache Utility`, () => {
  let createClientStub: SinonStub;
  let setSpy: SinonSpy;
  let getSpy: SinonSpy;
  let expireSpy: SinonSpy;
  let delSpy: SinonSpy;
  let flushDbSpy: SinonSpy;

  beforeEach(async () => {
    createClientStub = sinon.stub(redis, `createClient`);
    createClientStub.callsFake(fakeCreateClient);
    setSpy = sinon.spy(mockRedisClient, `set`);
    getSpy = sinon.spy(mockRedisClient, `get`);
    expireSpy = sinon.spy(mockRedisClient, `expire`);
    delSpy = sinon.spy(mockRedisClient, `del`);
    flushDbSpy = sinon.spy(mockRedisClient, `flushDb`);
    await cache.connect();
  });
  afterEach(() => {
    createClientStub.restore();
    setSpy.restore();
    getSpy.restore();
    expireSpy.restore();
    delSpy.restore();
    flushDbSpy.restore();
  });

  it(`should only call set function when data is cached`, async () => {
    const data = generateData();
    await cache.store(`data_key`, data);
    sinon.assert.calledOnceWithExactly(
      setSpy,
      `data_key`,
      JSON.stringify(data)
    );
    sinon.assert.notCalled(expireSpy);
  });

  it(`should also call expire when cache duration is provided`, async () => {
    const duration = 10;
    const data = generateData();
    await cache.store(`data_key`, data, duration);
    sinon.assert.calledOnceWithExactly(
      setSpy,
      `data_key`,
      JSON.stringify(data)
    );
    sinon.assert.calledOnceWithExactly(expireSpy, `data_key`, duration);
  });

  it(`should call the get function with the right parameter and return the right data`, async () => {
    const data = (await cache.get<FakeData>(`data_key`)) as FakeData;

    expect(data.name).toBe(cachedData.name);
    expect(data.email).toBe(cachedData.email);
    expect(data.id).toBe(cachedData.id);
    sinon.assert.calledOnceWithExactly(getSpy, `data_key`);
  });

  it(`should return null when the cached data is empty`, async () => {
    const data = await cache.get<FakeData>(`empty`);

    expect(data).toBeNull();
    sinon.assert.calledOnceWithExactly(getSpy, `empty`);
  });

  it(`should call the del function when the cache data is deleted`, async () => {
    await cache.delete(`data_key`);

    sinon.assert.calledOnceWithExactly(delSpy, `data_key`);
  });

  it(`should call the flushDb function when all the cached data is cleared`, async () => {
    await cache.clear();

    sinon.assert.calledOnceWithExactly(flushDbSpy);
  });

  const generateData = () => ({
    name: faker.name.fullName(),
    email: faker.internet.email()
  });
});
