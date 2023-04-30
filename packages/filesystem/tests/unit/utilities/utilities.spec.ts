import { FileSystemDriver, S3Config } from '@men-mvc/config';
import sinon, { createSandbox, SinonSandbox } from 'sinon';
import path from 'path';
import { faker } from '@faker-js/faker';
import { getServerDirectory, setServerDirectory } from '@men-mvc/foundation';
import fs from 'fs';
import {
  getStorageDirectory,
  parseMultiFormBooleanInput,
  getPublicStorageDirectory,
  isPublicFilepath,
  removePublicStorageDirnameFrom,
  getPrivateStorageDirectory,
  removeLeadingPathSep,
  getPathInStorage,
  getPrivateStorageDirname,
  getPublicStorageDirname,
  isPrivateFilepath,
  createStorageDirectoryIfNotExists
} from '../../../src';
import * as utilities from '../../../src/utilities/utilities';
import { generateBaseConfig } from '../../testUtilities';

const serverDirectoryBeforeTests = getServerDirectory();
describe(`Filesystem - Utilities`, () => {
  let sandbox: SinonSandbox;

  beforeAll(() => {
    setServerDirectory(process.cwd());
  });

  afterAll(() => {
    setServerDirectory(serverDirectoryBeforeTests);
  });

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`getStorageDirname`, () => {
    it(`should return dirname in the config`, () => {
      const dirname = faker.system.directoryPath();
      const baseConfig = generateBaseConfig({
        fileSystem: {
          storageDirname: dirname
        }
      });
      sandbox.stub(utilities, 'getBaseConfig').returns(baseConfig);
      expect(utilities.getStorageDirname()).toEqual(dirname);
    });

    it(`should return storage by default`, () => {
      const baseConfig = generateBaseConfig({
        fileSystem: {}
      });
      sandbox.stub(utilities, 'getBaseConfig').returns(baseConfig);
      expect(utilities.getStorageDirname()).toEqual(`storage`);
    });
  });

  describe(`createStorageDirectoryIfNotExists`, () => {
    it(`should create storage directory and its child directories`, async () => {
      if (fs.existsSync(getStorageDirectory())) {
        fs.rmdirSync(getStorageDirectory(), { recursive: true });
      }
      expect(fs.existsSync(getStorageDirectory())).toBeFalsy();
      expect(fs.existsSync(getPrivateStorageDirectory())).toBeFalsy();
      expect(fs.existsSync(getPublicStorageDirectory())).toBeFalsy();
      await createStorageDirectoryIfNotExists();
      expect(fs.existsSync(getStorageDirectory())).toBeTruthy();
      expect(fs.existsSync(getPrivateStorageDirectory())).toBeTruthy();
      expect(fs.existsSync(getPublicStorageDirectory())).toBeTruthy();
    });
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
    it(`should return true when path starts with public storage dirname`, () => {
      expect(
        isPublicFilepath(
          path.join(getPublicStorageDirname(), faker.system.filePath())
        )
      ).toBeTruthy();
    });

    it(`should return false when path does not stat with public storage dirname`, () => {
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

  describe(`isPrivateFilepath`, () => {
    it(`should return true when path starts with private storage dirname`, () => {
      expect(
        isPrivateFilepath(
          path.join(getPrivateStorageDirname(), faker.system.filePath())
        )
      ).toBeTruthy();
    });

    it(`should return false when path does not stat with private storage dirname`, () => {
      expect(isPrivateFilepath(faker.system.filePath())).toBeFalsy();
    });

    it(`should ignore leading path separator`, () => {
      const filepath = `${path.sep}${path.join(
        getPrivateStorageDirname(),
        faker.system.filePath()
      )}`;
      expect(isPrivateFilepath(filepath)).toBeTruthy();
    });
  });

  describe(`getPublicStorageDirectory`, () => {
    it(`should return storage + men-public`, () => {
      expect(getPublicStorageDirectory()).toBe(
        path.join(path.join(process.cwd(), `storage`), 'men-public')
      );
    });
  });

  describe(`getPrivateStorageDirectory`, () => {
    it(`should return storage + men-private`, () => {
      expect(getPrivateStorageDirectory()).toBe(
        path.join(path.join(process.cwd(), `storage`), 'men-private')
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

  describe(`getStorageDirectory`, () => {
    it(`should return app root directory + storage dirname`, () => {
      const storageDirname = `testStorage`;
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            storageDirname
          }
        })
      );

      expect(utilities.getStorageDirectory()).toBe(
        path.join(process.cwd(), storageDirname)
      );
    });
  });
});
