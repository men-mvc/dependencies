import { srcDirectory, unsetEnvVariable } from '@men-mvc/config';
import { faker } from '@faker-js/faker';
import {
  clearIsInSourceDirCachedValue,
  getServerDirectory,
  isInSourceDirectory,
  setServerDirectory
} from '../../../src';

describe(`App Utility`, () => {
  afterEach(() => {
    unsetEnvVariable('SERVER_DIRECTORY');
    clearIsInSourceDirCachedValue();
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
      expect(() => {
        isInSourceDirectory();
      }).toThrow('Application server is missing.');
    });

    it(`should throw error when the last segment of the path is empty`, () => {
      setServerDirectory('/dist//'); // function will remove the trailing slash
      expect(() => {
        isInSourceDirectory();
      }).toThrow(
        'Application server does not exist in the src or dist folder.'
      );
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
});
