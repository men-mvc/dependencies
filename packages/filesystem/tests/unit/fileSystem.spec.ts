import path from 'path';
import { faker } from '@faker-js/faker';
import sinon from 'sinon';
import { FileSystem, getPublicStorageIdentifier } from '../../src';

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
    it(`should throws error when filepath starts with ${getPublicStorageIdentifier()}`, () => {
      expect(
        FileSystem.getInstance().writeFile(
          path.join(getPublicStorageIdentifier(), faker.system.fileName()),
          faker.datatype.uuid()
        )
      ).rejects.toThrow(
        `Filename/ filepath passed to writeFile cannot start with ${getPublicStorageIdentifier()}`
      );
    });

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
    it(`should invoke writeFilePublicly function of underlying storage path`, async () => {
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
