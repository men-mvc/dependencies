import { setEnvVariable, srcDirectory } from '@men-mvc/config';
import { faker } from '@faker-js/faker';
import * as appUtilities from '../../../src/utilities/app';
import {
  getServerDirectory,
  getSourceCodeDirectory,
  isInSourceDirectory,
  setServerDirectory
} from '../../../src/utilities/app';

describe(`App Utility`, () => {
  afterEach(() => (process.env['SERVER_DIRECTORY'] = undefined));

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

  describe(`setServerDirectory & getServerDirectory`, () => {
    it(`should set SERVER_DIRECTORY env variable`, () => {
      const fakeServerDir = faker.lorem.sentence();
      setServerDirectory(fakeServerDir);
      expect(process.env.SERVER_DIRECTORY).toBe(fakeServerDir);
    });

    it(`should return the SERVER_DIRECTORY env variable's value`, () => {
      const fakeServerDir = faker.lorem.sentence();
      process.env['SERVER_DIRECTORY'] = fakeServerDir;
      expect(getServerDirectory()).toBe(fakeServerDir);
    });

    it(`should return the value set by setServerDirectory`, () => {
      const fakeServerDir = faker.lorem.sentence();
      setServerDirectory(fakeServerDir);
      expect(getServerDirectory()).toBe(fakeServerDir);
    });
  });

  describe(`isInSourceDirectory`, () => {
    it(`should throw error when the server directory is not set`, () => {
      setServerDirectory('');
      try {
        isInSourceDirectory();
        throw new Error(`Expected error was not thrown`);
      } catch (e) {
        expect(
          e instanceof Error && e.message === 'Application server is missing.'
        ).toBeTruthy();
      }
    });

    it(`should throw error when the last segment of the path is empty`, () => {
      setServerDirectory('/dist//'); // function will remove the trailing slash
      try {
        isInSourceDirectory();
        throw new Error(`Expected error was not thrown`);
      } catch (e) {
        expect(
          e instanceof Error &&
            e.message ===
              'Application server does not exist in the src or dist folder.'
        ).toBeTruthy();
      }
    });

    it(`should return true when the last segment of the path is src`, () => {
      setServerDirectory(`/app/${srcDirectory}`);
      expect(isInSourceDirectory()).toBeTruthy();
    });

    it(`should ignore the last trailing path separator in the path`, () => {
      setServerDirectory(`/app/src/${srcDirectory}`);
      expect(isInSourceDirectory()).toBeTruthy();
    });

    it(`should return false when the last segment of the path is not src`, () => {
      setServerDirectory('/app/dist');
      expect(isInSourceDirectory()).toBeFalsy();
    });

    it(`should be case-insensitive`, () => {
      setServerDirectory('/app/Src');
      expect(isInSourceDirectory()).toBeTruthy();
    });
  });

  describe(`getSourceCodeDirectory`, () => {
    it(`should return path with src when the server is in the src directory`, () => {
      setServerDirectory(`/app/${srcDirectory}`);
      expect(getSourceCodeDirectory()).toBe(`${process.cwd()}/${srcDirectory}`);
    });

    it(`should return path with dist when the server is in the dist directory`, () => {
      setServerDirectory(`/app/`);
      expect(getSourceCodeDirectory()).toBe(`${process.cwd()}`);
    });
  });
});
