import { FileSystem } from '../../src';

describe(`FileSystem`, () => {
  beforeEach(() => {
    FileSystem.resetInstance();
  });

  describe(`getInstance`, () => {
    it(`should always return the same instance`, () => {
      expect(FileSystem.getInstance()).toBe(FileSystem.getInstance());
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
