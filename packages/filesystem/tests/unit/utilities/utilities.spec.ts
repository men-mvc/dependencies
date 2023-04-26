import {
  FileSystemDriver,
  S3Config,
  setEnvVariable,
  unsetEnvVariable
} from '@men-mvc/config';
import sinon, { createSandbox, SinonSandbox } from 'sinon';
import path from 'path';
import { faker } from '@faker-js/faker';
import {
  clearStorageDirectoryCache,
  getStorageDirectory,
  getDefaultAppStorageDirectory,
  parseMultiFormBooleanInput,
  getPublicStorageDirectory,
  isPublicFilepath,
  removePublicStorageDirnameFrom,
  getPrivateStorageDirectory,
  removeLeadingPathSep,
  getPathInStorage,
  getPrivateStorageDirname,
  getPublicStorageDirname
} from '../../../src';
import * as foundation from '../../../src/foundation';
import * as utilities from '../../../src/utilities/utilities';
import { generateBaseConfig } from '../../testUtilities';

describe(`Filesystem - Utilities`, () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    unsetEnvVariable('SERVER_DIRECTORY');
    unsetEnvVariable('FILESYSTEM_STORAGE_DIRECTORY');
    clearStorageDirectoryCache();
    sandbox.restore();
  });

  describe(`getDriver`, () => {
    it(`should return the driver defined in the config`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            storageDriver: FileSystemDriver.s3
          }
        })
      );

      expect(utilities.getDriver()).toBe(FileSystemDriver.s3);
    });

    it(`should return local driver by default when there is no driver defined in the config`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: undefined
        })
      );

      expect(utilities.getDriver()).toBe(FileSystemDriver.local);
    });
  });

  describe(`getLocalUrlSignerSecret`, () => {
    it(`should return value defined in the config`, () => {
      const testSecret = faker.datatype.uuid();
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            local: {
              urlSignerSecret: testSecret,
              signedUrlDurationInSeconds: 200
            }
          }
        })
      );
      expect(utilities.getLocalUrlSignerSecret()).toBe(testSecret);
    });
  });

  describe(`getCloudFrontDomain`, () => {
    it(`should return cloudfront domain set in the config`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            s3: {
              cloudfront: {
                domainName: `https://cloudfront.example.com`
              }
            } as S3Config
          }
        })
      );

      expect(utilities.getCloudFrontDomain()).toBe(
        `https://cloudfront.example.com`
      );
    });
  });

  describe(`isUsingCloudFront`, () => {
    it(`should return true when cloudfront domain name is set`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            s3: {
              cloudfront: {
                domainName: `http://cloudfront.example.com`
              }
            } as S3Config
          }
        })
      );

      expect(utilities.isUsingCloudFront()).toBeTruthy();
    });

    it(`should return false when cloudfront domain name is not set`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            s3: {
              cloudfront: {}
            } as S3Config
          }
        })
      );

      expect(utilities.isUsingCloudFront()).toBeFalsy();
    });
  });

  describe(`removeLeadingPathSeparator`, () => {
    it(`should remove leading path.sep`, () => {
      expect(removeLeadingPathSep(`${path.sep}testing.txt`)).toBe(
        `testing.txt`
      );
    });

    it(`should remove leading fore slash`, () => {
      expect(removeLeadingPathSep(`/testing.txt`)).toBe(`testing.txt`);
    });

    it(`should return the filepath as is`, () => {
      expect(removeLeadingPathSep(`testing.txt`)).toBe(`testing.txt`);
    });
  });

  describe(`getPathInStorage`, () => {
    it(`should remove leading separator`, () => {
      const filepath = faker.system.filePath();
      const removeLeadingPathSepStub = sandbox
        .stub(utilities, `removeLeadingPathSep`)
        .returns(filepath);
      getPathInStorage(filepath);

      sinon.assert.calledOnceWithExactly(removeLeadingPathSepStub, filepath);
    });

    it(`should append public storage dir path when isPublic is true`, () => {
      const filepath = faker.system.filePath();

      expect(getPathInStorage(filepath, true)).toBe(
        path.join(getPublicStorageDirname(), filepath)
      );
    });

    it(`should append private storage dir path when isPublic is false`, () => {
      const filepath = faker.system.filePath();

      expect(getPathInStorage(filepath)).toBe(
        path.join(getPrivateStorageDirname(), filepath)
      );
    });
  });

  describe(`removePublicStorageDirnameFrom`, () => {
    it(`should return argument filepath as is when the file is not public`, async () => {
      const filepath = faker.system.filePath();
      expect(removePublicStorageDirnameFrom(filepath)).toBe(filepath);
    });

    it(`should replace the first occurrence of ${getPublicStorageDirname()}`, async () => {
      const filepathWithoutPublicFileIdentifier = path.join(
        faker.datatype.uuid(),
        getPublicStorageDirname(),
        `${faker.datatype.uuid()}.png`
      );
      const filepath = path.join(
        getPublicStorageDirname(),
        filepathWithoutPublicFileIdentifier
      );

      expect(removePublicStorageDirnameFrom(filepath)).toBe(
        filepathWithoutPublicFileIdentifier
      );
    });
  });

  describe(`isPublicFilepath`, () => {
    it(`should return true when path starts with public storage identifier`, () => {
      expect(
        isPublicFilepath(
          path.join(getPublicStorageDirname(), faker.system.filePath())
        )
      ).toBeTruthy();
    });

    it(`should return false when path does not stat with public storage identifier`, () => {
      expect(isPublicFilepath(faker.system.filePath())).toBeFalsy();
    });

    it(`should ignore leading path separator`, () => {
      const filepath = `${path.sep}${path.join(
        getPublicStorageDirname(),
        faker.system.filePath()
      )}`;
      expect(isPublicFilepath(filepath)).toBeTruthy();
    });
  });

  describe(`getPublicStorageDirectory`, () => {
    it(`should return storage + men-public`, () => {
      const fakeStorageDir = faker.system.directoryPath();
      setEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, fakeStorageDir);
      expect(getPublicStorageDirectory()).toBe(
        path.join(fakeStorageDir, 'men-public')
      );
    });
  });

  describe(`getPrivateStorageDirectory`, () => {
    it(`should return storage + men-private`, () => {
      const fakeStorageDir = faker.system.directoryPath();
      setEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, fakeStorageDir);
      expect(getPrivateStorageDirectory()).toBe(
        path.join(fakeStorageDir, 'men-private')
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

  describe(`getStorageDirectory`, () => {
    afterAll(() => {
      setEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, ``);
    });

    it(`should return value of FILESYSTEM_STORAGE_DIRECTORY env variable when var is set`, () => {
      const fakeStorageDir = `~/home/custom_storage`;
      setEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, fakeStorageDir);
      const storageDir = getStorageDirectory();
      expect(storageDir).toBe(fakeStorageDir);
    });

    it(`should return default storage directory if the FILESYSTEM_STORAGE_DIRECTORY var is not set`, () => {
      unsetEnvVariable('FILESYSTEM_STORAGE_DIRECTORY');
      const fakeDefaultStorageDirectory = faker.system.directoryPath();
      const getDefaultAppStorageDirectoryStub = sinon
        .stub(utilities, `getDefaultAppStorageDirectory`)
        .returns(fakeDefaultStorageDirectory);
      expect(getStorageDirectory()).toBe(fakeDefaultStorageDirectory);
      getDefaultAppStorageDirectoryStub.restore();
    });
  });
});
