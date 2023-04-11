import { setEnvVariable, unsetEnvVariable } from '@men-mvc/config';
import sinon from 'sinon';
import path from 'path';
import { faker } from '@faker-js/faker';
import {
  clearAppStorageDirectoryCache,
  getAppStorageDirectory,
  getDefaultAppStorageDirectory,
  parseMultiFormBooleanInput
} from '../../../src';
import * as foundationUtilities from '../../../src/foundation';
import * as utilities from '../../../src/utilities/utilities';

describe(`App Utility`, () => {
  afterEach(() => {
    unsetEnvVariable('SERVER_DIRECTORY');
    clearAppStorageDirectoryCache();
  });

  describe(`parseMultiFormBooleanInput`, () => {
    it(`should return true when the input string is "true"`, () => {
      expect(parseMultiFormBooleanInput('TrUe')).toBeTruthy();
    });

    it(`should return false when the input string is "false"`, () => {
      expect(parseMultiFormBooleanInput('False')).toBeFalsy();
    });

    it(`should return true when the input number is 1`, () => {
      expect(parseMultiFormBooleanInput(1)).toBeTruthy();
    });

    it(`should return false when the input number is 0`, () => {
      expect(parseMultiFormBooleanInput(0)).toBeFalsy();
    });

    it(`should return input as is when the input type is boolean`, () => {
      const input = faker.datatype.boolean();
      expect(parseMultiFormBooleanInput(input)).toBe(input);
    });
  });

  describe(`getDefaultAppStorageDirectory`, () => {
    it(`should return app root directory + dirname`, () => {
      const appRootDir = faker.system.filePath();
      const getAppRootDirectoryStub = sinon
        .stub(foundationUtilities, `getAppRootDirectory`)
        .returns(appRootDir);

      expect(getDefaultAppStorageDirectory()).toBe(
        path.join(appRootDir, 'storage')
      );
      getAppRootDirectoryStub.restore();
    });
  });

  describe(`getAppStorageDirectory`, () => {
    afterAll(() => {
      setEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, ``);
    });

    it(`should return value of FILESYSTEM_STORAGE_DIRECTORY env variable when var is set`, () => {
      const fakeStorageDir = `~/home/custom_storage`;
      setEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, fakeStorageDir);
      const storageDir = getAppStorageDirectory();
      expect(storageDir).toBe(fakeStorageDir);
    });

    it(`should return default storage directory if the FILESYSTEM_STORAGE_DIRECTORY var is not set`, () => {
      unsetEnvVariable('FILESYSTEM_STORAGE_DIRECTORY');
      const fakeDefaultStorageDirectory = faker.system.directoryPath();
      const getDefaultAppStorageDirectoryStub = sinon
        .stub(utilities, `getDefaultAppStorageDirectory`)
        .returns(fakeDefaultStorageDirectory);
      expect(getAppStorageDirectory()).toBe(fakeDefaultStorageDirectory);
      getDefaultAppStorageDirectoryStub.restore();
    });
  });
});
