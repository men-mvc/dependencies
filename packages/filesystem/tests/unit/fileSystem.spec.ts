import path from 'path';
import { faker } from '@faker-js/faker';
import sinon from 'sinon';
import { generateUploadedFile } from '@men-mvc/test';
import { FileSystem, getPublicStorageDirname } from '../../src';

describe(`FileSystem`, () => {
  beforeEach(() => {
    FileSystem.resetInstance();
  });

  describe(`getInstance`, () => {
    it(`should always return the same instance`, () => {
      expect(FileSystem.getInstance()).toBe(FileSystem.getInstance());
    });
  });

  describe(`writeFile`, () => {
    it(`should invoke writeFile function of underlying storage path`, async () => {
      const instance = FileSystem.getInstance() as FileSystem;
      const writeFileStub = sinon.stub(
        instance.getStorageInstance(),
        'writeFile'
      );
      const filepath = faker.system.filePath();
      const content = faker.datatype.uuid();
      await FileSystem.getInstance().writeFile(filepath, content, {});
      sinon.assert.calledOnceWithExactly(writeFileStub, filepath, content, {});
      writeFileStub.restore();
    });
  });

  describe(`writeFilePublicly`, () => {
    it(`should invoke writeFilePublicly function of underlying storage instance`, async () => {
      const instance = FileSystem.getInstance() as FileSystem;
      const writeFilePubliclyStub = sinon.stub(
        instance.getStorageInstance(),
        'writeFilePublicly'
      );
      const filepath = faker.system.filePath();
      const content = faker.datatype.uuid();
      await FileSystem.getInstance().writeFilePublicly(filepath, content, {});
      sinon.assert.calledOnceWithExactly(
        writeFilePubliclyStub,
        filepath,
        content,
        {}
      );
      writeFilePubliclyStub.restore();
    });
  });

  describe(`storeFilePublicly`, () => {
    it(`should invoke storeFilePublicly function of underlying fileUploader instance`, async () => {
      const instance = FileSystem.getInstance() as FileSystem;
      const storeFilePubliclyStub = sinon.stub(
        instance.getUploaderInstance(),
        'storeFilePublicly'
      );
      const filename = faker.datatype.uuid();
      const directory = faker.datatype.uuid();
      const uploadedFile = generateUploadedFile();
      await FileSystem.getInstance().storeFilePublicly({
        uploadedFile,
        filename,
        directory
      });
      sinon.assert.calledOnceWithExactly(storeFilePubliclyStub, {
        uploadedFile,
        filename,
        directory
      });
      storeFilePubliclyStub.restore();
    });
  });

  describe(`getUploaderInstance`, () => {
    it(`should always return the same instance`, () => {
      const fileSystem = new FileSystem();
      expect(fileSystem.getUploaderInstance()).toBe(
        fileSystem.getUploaderInstance()
      );
    });
  });

  describe(`getStorageInstance`, () => {
    it(`should always return the same instance`, () => {
      const fileSystem = new FileSystem();
      expect(fileSystem.getStorageInstance()).toBe(
        fileSystem.getStorageInstance()
      );
    });
  });
});
