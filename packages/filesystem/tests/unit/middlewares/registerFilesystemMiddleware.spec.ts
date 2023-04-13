import { Request, Response } from 'express';
import sinon from 'sinon';
import fs from 'fs';
import { getServerDirectory, setServerDirectory } from '@men-mvc/foundation';
import { createStorageDirectoryIfNeeded, FileSystem } from '../../../src';
import * as utilities from '../../../src/utilities/utilities';
import {
  getPrivateStorageDirectory,
  getPublicStorageDirectory
} from '../../../src';

const serverDirBeforeTests = getServerDirectory();
describe(`registerFilesystem middleware`, () => {
  beforeEach(() => {
    FileSystem.storageDirCreated = false;
    setServerDirectory(process.cwd());
    if (fs.existsSync(getPrivateStorageDirectory())) {
      fs.rmdirSync(getPrivateStorageDirectory(), {
        recursive: true
      });
    }
  });
  afterEach(() => {
    FileSystem.storageDirCreated = false;
    setServerDirectory(serverDirBeforeTests);
    if (fs.existsSync(getPrivateStorageDirectory())) {
      fs.rmdirSync(getPrivateStorageDirectory(), {
        recursive: true
      });
    }
  });

  describe(`createStorageDirectoryIfNeeded`, () => {
    it(`should create private and public storage directories`, async () => {
      await createStorageDirectoryIfNeeded(
        {} as Request,
        {} as Response,
        () => {}
      );
      expect(fs.existsSync(getPrivateStorageDirectory())).toBeTruthy();
      console.log(getPublicStorageDirectory());
      expect(fs.existsSync(getPublicStorageDirectory())).toBeTruthy();
    });

    it(`should set storageDirCreated to true after creating the directories`, async () => {
      expect(FileSystem.storageDirCreated).toBeFalsy();
      await createStorageDirectoryIfNeeded(
        {} as Request,
        {} as Response,
        jest.fn()
      );
      expect(FileSystem.storageDirCreated).toBeTruthy();
    });

    it(`should not create directories if storageDirCreated is already true`, async () => {
      const mkdirAsyncStub = sinon.stub(utilities, `mkdirAsync`);
      FileSystem.storageDirCreated = true;
      await createStorageDirectoryIfNeeded(
        {} as Request,
        {} as Response,
        jest.fn()
      );
      sinon.assert.notCalled(mkdirAsyncStub);
    });
  });
});
