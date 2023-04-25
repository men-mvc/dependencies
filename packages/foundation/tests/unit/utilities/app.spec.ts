import express, { Request } from 'express';
import {
  setEnvVariable,
  srcDirectory,
  unsetEnvVariable
} from '@men-mvc/config';
import { faker } from '@faker-js/faker';
import {
  clearAppRootDirectoryCache,
  clearIsInSourceDirCachedValue,
  getAppBaseUrl,
  getAppRootDirectory,
  getServerDirectory,
  isInSourceDirectory,
  setServerDirectory
} from '../../../src';
import { BaseApplication } from '../../../src';

class TestApplication extends BaseApplication {
  initialise = () => {};

  initialisePreMiddlewares = () => {};

  registerRoutes = () => {};

  initialisePostMiddlewares = () => {};

  start = () => {};
}

describe(`App Utility`, () => {
  afterEach(() => {
    unsetEnvVariable('SERVER_DIRECTORY');
    clearIsInSourceDirCachedValue();
  });

  describe(`getAppBaseUrl`, () => {
    afterEach(() => {
      setEnvVariable(`APP_BASE_URL`, ``);
      BaseApplication.clearInstance();
    });

    it(`should return value of APP_BASE_URL env variable`, () => {
      const url = faker.internet.url();
      setEnvVariable(`APP_BASE_URL`, url);
      expect(getAppBaseUrl()).toBe(url);
    });

    it(`should return protocol + host`, () => {
      const protocol = 'https';
      const host = 'localhost:8000';
      const request = {
        protocol,
        get: (name: string) => host
      } as Request;
      const app = BaseApplication.init(new TestApplication(express()));
      app.setCurrentRequest(request);
      expect(getAppBaseUrl()).toBe(`${protocol}://${host}`);
    });
  });

  describe(`getAppRootDirectory`, () => {
    afterEach(() => {
      clearAppRootDirectoryCache();
    });

    it(`it should throw error when the server directory is empty`, () => {
      setServerDirectory(``);
      expect(() => {
        getAppRootDirectory();
      }).toThrow(
        `Unable to get app project directory as the server directory is not set.`
      );
    });

    it(`should return server directory if the server file is not in source directory`, () => {
      setServerDirectory(`/test/dist`);
      expect(getAppRootDirectory()).toBe(`/test/dist`);
    });

    it(`should return server directory without src when the server file is in source directory`, () => {
      setServerDirectory(`/test/app/src`);
      expect(getAppRootDirectory()).toBe(`/test/app`);
    });

    it(`should ignore the last path.sep if the path ends with path.sep`, () => {
      setServerDirectory(`/test/app/src/`);
      expect(getAppRootDirectory()).toBe(`/test/app`);
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
