import * as appUtilities from '../../../src/utilities/app';
import { setEnvVariable } from '@men-mvc/config';

describe(`App Utility`, () => {
  describe(`getAppStorageDirectory`, () => {
    afterAll(() => {
      setEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, ``);
    });

    it(`should return value of FILESYSTEM_STORAGE_DIRECTORY env variable when var is set`, () => {
      const fakeStorageDir = `~/home/custom_storage`;
      setEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, fakeStorageDir);
      const storageDir = appUtilities.getAppStorageDirectory();
      expect(storageDir).toBe(fakeStorageDir);
    });

    it(`should return cwd/storage by default`, () => {
      setEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, ``);
      const storageDir = appUtilities.getAppStorageDirectory();
      expect(storageDir).toBe(`${process.cwd()}/storage`);
    });
  });
});
