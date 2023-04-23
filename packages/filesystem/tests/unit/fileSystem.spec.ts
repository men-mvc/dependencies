import { faker } from '@faker-js/faker';
import sinon, { createSandbox, SinonSandbox } from 'sinon';
import { generateUploadedFile } from '@men-mvc/test';
import { FileSystemDriver } from '@men-mvc/config';
import { FileSystem, LocalStorage, S3Storage } from '../../src';
import * as utilities from '../../src/utilities/utilities';

describe(`FileSystem`, () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    FileSystem.resetInstance();
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`getInstance`, () => {
    it(`should always return the same instance`, () => {
      expect(FileSystem.getInstance()).toBe(FileSystem.getInstance());
    });
  });

  describe(`getPublicUrl`, () => {
    it(`should invoke getPublic function of the underlying storage instance`, () => {
      const instance = FileSystem.getInstance() as FileSystem;
      const filepath = `${faker.datatype.uuid()}.png`;
      const expectedPublicUrl = `${faker.internet.url()}/${filepath}`;
      const getPublicUrlStub = sinon
        .stub(instance.getStorageInstance(), `getPublicUrl`)
        .returns(expectedPublicUrl);
      const result = FileSystem.getInstance().getPublicUrl(filepath);
      expect(result).toBe(expectedPublicUrl);
      sinon.assert.calledOnceWithExactly(getPublicUrlStub, filepath);
      getPublicUrlStub.restore();
    });
  });

  describe(`getSignedUrl`, () => {
    it(`should invoke getSignedUrl function of the  underlying storage instance`, () => {
      const instance = FileSystem.getInstance() as FileSystem;
      const filepath = `${faker.datatype.uuid()}.png`;
      const expectedSignedUrl = `${faker.internet.url()}/${filepath}?hash=${faker.datatype.uuid()}`;
      const getSignedUrlStub = sinon
        .stub(instance.getStorageInstance(), `getSignedUrl`)
        .returns(expectedSignedUrl);
      const result = FileSystem.getInstance().getSignedUrl(filepath, 200);
      expect(result).toBe(expectedSignedUrl);
      sinon.assert.calledOnceWithExactly(getSignedUrlStub, filepath, 200);
      getSignedUrlStub.restore();
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

  describe(`mkdir`, () => {
    it(`should invoke mkdir function of the underlying storage instance`, async () => {
      const instance = FileSystem.getInstance() as FileSystem;
      const mkdirStub = sinon.stub(instance.getStorageInstance(), `mkdir`);
      const dir = faker.datatype.uuid();
      await instance.mkdir(dir);
      sinon.assert.calledOnceWithExactly(mkdirStub, dir);
      mkdirStub.restore();
    });
  });

  describe(`mkdirPrivate`, () => {
    it(`should invoke mkdirPrivate function of the underlying storage instance`, async () => {
      const instance = FileSystem.getInstance() as FileSystem;
      const mkdirPrivateStub = sinon.stub(
        instance.getStorageInstance(),
        `mkdirPrivate`
      );
      const dir = faker.datatype.uuid();
      await instance.mkdirPrivate(dir);
      sinon.assert.calledOnceWithExactly(mkdirPrivateStub, dir);
      mkdirPrivateStub.restore();
    });
  });

  describe(`mkdirPublic`, () => {
    it(`should invoke mkdirPublic function of the underlying storage instance`, async () => {
      const instance = FileSystem.getInstance() as FileSystem;
      const mkdirPublicStub = sinon.stub(
        instance.getStorageInstance(),
        `mkdirPublic`
      );
      const dir = faker.datatype.uuid();
      await instance.mkdirPublic(dir);
      sinon.assert.calledOnceWithExactly(mkdirPublicStub, dir);
      mkdirPublicStub.restore();
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

    it(`should return instance of LocalStorage`, () => {
      sandbox.stub(utilities, `getDriver`).returns(FileSystemDriver.local);
      const fileSystem = new FileSystem();
      expect(
        fileSystem.getStorageInstance() instanceof LocalStorage
      ).toBeTruthy();
    });

    it(`should return instance of S3Storage`, () => {
      sandbox.stub(utilities, `getDriver`).returns(FileSystemDriver.s3);
      const fileSystem = new FileSystem();
      expect(fileSystem.getStorageInstance() instanceof S3Storage).toBeTruthy();
    });
  });
});
