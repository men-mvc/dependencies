import { setEnvVariable, unsetEnvVariable } from '@men-mvc/config';
import sinon from 'sinon';
import path from 'path';
import { faker } from '@faker-js/faker';
import {
  clearPrivateStorageDirectoryCache,
  getPrivateStorageDirectory,
  getDefaultAppStorageDirectory,
  parseMultiFormBooleanInput,
  getPublicStorageDirectory,
  getPublicStorageIdentifier,
  isPublicFilepath,
  removePublicStorageIdentifierFrom
} from '../../../src';
import * as foundation from '../../../src/foundation';
import * as utilities from '../../../src/utilities/utilities';

describe(`Filesystem - Utilities`, () => {
  afterEach(() => {
    unsetEnvVariable('SERVER_DIRECTORY');
    clearPrivateStorageDirectoryCache();
  });

  describe(`removePublicStorageIdentifierFrom`, () => {
    it(`should return argument filepath as is when the file is not public`, async () => {
      const filepath = faker.system.filePath();
      expect(removePublicStorageIdentifierFrom(filepath)).toBe(filepath);
    });

    it(`should replace the first occurrence of ${getPublicStorageIdentifier()}`, async () => {
      const filepathWithoutPublicFileIdentifier = path.join(
        faker.datatype.uuid(),
        getPublicStorageIdentifier(),
        `${faker.datatype.uuid()}.png`
      );
      const filepath = path.join(
        getPublicStorageIdentifier(),
        filepathWithoutPublicFileIdentifier
      );

      expect(removePublicStorageIdentifierFrom(filepath)).toBe(
        filepathWithoutPublicFileIdentifier
      );
    });
  });

  describe(`isPublicFilepath`, () => {
    it(`should return true when path starts with public storage identifier`, () => {
      expect(
        isPublicFilepath(
          path.join(getPublicStorageIdentifier(), faker.system.filePath())
        )
      ).toBeTruthy();
    });

    it(`should return false when path does not stat with public storage identifier`, () => {
      expect(isPublicFilepath(faker.system.filePath())).toBeFalsy();
    });

    it(`should ignore leading path separator`, () => {
      const filepath = `${path.sep}${path.join(
        getPublicStorageIdentifier(),
        faker.system.filePath()
      )}`;
      expect(isPublicFilepath(filepath)).toBeTruthy();
    });
  });

  describe(`getPublicStorageDirectory`, () => {
    it(`should return private storage + men + public`, () => {
      const fakeStorageDir = faker.system.directoryPath();
      setEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, fakeStorageDir);
      expect(getPublicStorageDirectory()).toBe(
        path.join(fakeStorageDir, 'men-public')
      );
    });
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
        .stub(foundation, `getAppRootDirectory`)
        .returns(appRootDir);

      expect(getDefaultAppStorageDirectory()).toBe(
        path.join(appRootDir, 'storage')
      );
      getAppRootDirectoryStub.restore();
    });
  });

  describe(`getPrivateStorageDirectory`, () => {
    afterAll(() => {
      setEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, ``);
    });

    it(`should return value of FILESYSTEM_STORAGE_DIRECTORY env variable when var is set`, () => {
      const fakeStorageDir = `~/home/custom_storage`;
      setEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, fakeStorageDir);
      const storageDir = getPrivateStorageDirectory();
      expect(storageDir).toBe(fakeStorageDir);
    });

    it(`should return default storage directory if the FILESYSTEM_STORAGE_DIRECTORY var is not set`, () => {
      unsetEnvVariable('FILESYSTEM_STORAGE_DIRECTORY');
      const fakeDefaultStorageDirectory = faker.system.directoryPath();
      const getDefaultAppStorageDirectoryStub = sinon
        .stub(utilities, `getDefaultAppStorageDirectory`)
        .returns(fakeDefaultStorageDirectory);
      expect(getPrivateStorageDirectory()).toBe(fakeDefaultStorageDirectory);
      getDefaultAppStorageDirectoryStub.restore();
    });
  });
});
