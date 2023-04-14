import sinon, { SinonStub } from 'sinon';
import { faker } from '@faker-js/faker';
import { readReadableAsString, replaceRouteParams } from '@men-mvc/foundation';
import { Buffer } from 'buffer';
import { ReadStream } from 'fs';
import { Readable } from 'stream';
import { S3Storage } from '../../../src/s3/s3Storage';
import {
  getPublicStorageIdentifier,
  MenS3PutObjectCommandOutput
} from '../../../src';
import * as foundation from '../../../src/foundation';
import { viewPublicS3ObjectRoute } from '../../../lib/s3/viewPublicS3ObjectHandler';

const storage = new S3Storage();
describe(`S3Storage`, () => {
  describe(`getPublicUrl`, () => {
    /**
     * ! this test also ensures that the key is URL encoded.
     */
    it(`should return app base url + view public s3 object route providing key parameter with value`, async () => {
      const appBaseUrl = 'http://localhost';
      const getAppBaseUrlStub = sinon
        .stub(foundation, `getAppBaseUrl`)
        .returns(appBaseUrl);
      const key = `${getPublicStorageIdentifier()}/${faker.datatype.uuid()}[+].png`;
      expect(storage.getPublicUrl(key)).toBe(
        `${appBaseUrl}${replaceRouteParams(viewPublicS3ObjectRoute, {
          key: encodeURIComponent(key)
        })}`
      );
      getAppBaseUrlStub.restore();
    });
  });

  describe(`getAbsolutePath`, () => {
    it(`should return filename as is`, async () => {
      const filename = faker.datatype.uuid();
      expect(storage.getAbsolutePath(filename)).toBe(filename);
    });
  });

  describe(`createReadStream`, () => {
    it(`should invoke adapter's createReadStream function with the right parameters`, async () => {
      const createReadStreamStub = sinon.stub(
        storage.getS3Adapter(),
        `createReadStream`
      );
      const key = faker.datatype.uuid();
      await storage.createReadStream(key);
      sinon.assert.calledOnceWithExactly(createReadStreamStub, key);
      createReadStreamStub.restore();
    });

    it(`should return the output of the underlying function`, async () => {
      const fileContent = faker.lorem.sentence();
      const readable = Readable.from(Buffer.from(fileContent));
      const createReadStreamStub = sinon
        .stub(storage.getS3Adapter(), `createReadStream`)
        .returns(
          new Promise<ReadStream>((resolve) => resolve(readable as ReadStream))
        );
      const result = await storage.createReadStream(faker.datatype.uuid());
      expect(await readReadableAsString(result)).toBe(fileContent);
      createReadStreamStub.restore();
    });
  });

  describe(`copy`, () => {
    it(`should invoke adapter's copy function with the right parameters`, async () => {
      const copyStub = sinon.stub(storage.getS3Adapter(), `copy`);
      const fromKey = faker.datatype.uuid();
      const toKey = faker.datatype.uuid();
      await storage.copy(fromKey, toKey);
      sinon.assert.calledOnceWithExactly(copyStub, fromKey, toKey);
      copyStub.restore();
    });
  });

  describe(`rename`, () => {
    it(`should invoke adapter's rename function with the right parameters`, async () => {
      const renameStub = sinon.stub(storage.getS3Adapter(), `rename`);
      const fromKey = faker.datatype.uuid();
      const toKey = faker.datatype.uuid();
      await storage.rename(fromKey, toKey);
      sinon.assert.calledOnceWithExactly(renameStub, fromKey, toKey);
      renameStub.restore();
    });
  });

  describe(`writeFile`, () => {
    let writeFileStub: SinonStub;

    afterEach(() => {
      writeFileStub.restore();
    });

    it(`should invoke adapter's writeFile function with the right parameters`, async () => {
      writeFileStub = sinon.stub(storage.getS3Adapter(), `writeFile`);
      const data = faker.lorem.sentence();
      const key = faker.datatype.uuid();
      await storage.writeFile(key, data);
      sinon.assert.calledOnceWithExactly(writeFileStub, key, data);
    });

    it(`should return the created object locations`, async () => {
      const data = faker.lorem.sentence();
      const key = faker.datatype.uuid();
      const writeOutput = {
        VersionId: faker.datatype.uuid(),
        ServerSideEncryption: `AES256`
      };
      writeFileStub = sinon
        .stub(storage.getS3Adapter(), `writeFile`)
        .returns(
          new Promise((resolve) =>
            resolve(writeOutput as MenS3PutObjectCommandOutput)
          )
        );
      const result = await storage.writeFile(key, data);

      expect(result.storageFilepath).toBe(key);
      expect(result.absoluteFilepath).toBe(key);
      expect(result.VersionId).toBe(writeOutput.VersionId);
      expect(result.ServerSideEncryption).toBe(
        writeOutput.ServerSideEncryption
      );
    });
  });

  describe(`writeFilePublicly`, () => {
    let writeFileStub: SinonStub;
    beforeEach(() => {
      writeFileStub = sinon.stub(storage.getS3Adapter(), `writeFile`);
    });

    afterEach(() => {
      writeFileStub.restore();
    });

    it(`should invoke adapter's writeFile function with the right parameters appending ${getPublicStorageIdentifier()} to the key`, async () => {
      const data = faker.lorem.sentence();
      const key = faker.datatype.uuid();
      await storage.writeFilePublicly(key, data);
      sinon.assert.calledOnceWithExactly(
        writeFileStub,
        `${getPublicStorageIdentifier()}/${key}`,
        data
      );
    });

    it(`should remove leading slash in the key`, async () => {
      const data = faker.lorem.sentence();
      const key = faker.datatype.uuid();
      await storage.writeFilePublicly(`/${key}`, data);
      sinon.assert.calledOnceWithExactly(
        writeFileStub,
        `${getPublicStorageIdentifier()}/${key}`,
        data
      );
    });

    it(`should return the created object locations`, async () => {
      const data = faker.lorem.sentence();
      const key = faker.datatype.uuid();
      const expectedKey = `${getPublicStorageIdentifier()}/${key}`;
      const result = await storage.writeFilePublicly(key, data);
      expect(result.absoluteFilepath).toBe(expectedKey);
      expect(result.storageFilepath).toBe(expectedKey);
    });
  });

  describe(`deleteFile`, () => {
    it(`should invoke adapter's deleteFile function with the right parameters`, async () => {
      const deleteFileStub = sinon.stub(storage.getS3Adapter(), `deleteFile`);
      const key = faker.datatype.uuid();
      await storage.deleteFile(key);

      sinon.assert.calledOnceWithExactly(deleteFileStub, key);
      deleteFileStub.restore();
    });
  });

  describe(`deleteFiles`, () => {
    it(`should invoke adapter's deleteFiles function with the right parameters`, async () => {
      const deleteFilesStub = sinon.stub(storage.getS3Adapter(), `deleteFiles`);
      const keys = [faker.datatype.uuid(), faker.datatype.uuid()];
      await storage.deleteFiles(keys);

      sinon.assert.calledOnceWithExactly(deleteFilesStub, keys);
      deleteFilesStub.restore();
    });
  });

  describe(`exists`, () => {
    it(`should invoke adapter's exists function with the right parameters`, async () => {
      const existsStub = sinon.stub(storage.getS3Adapter(), `exists`);
      const key = faker.datatype.uuid();
      await storage.exists(key);

      sinon.assert.calledOnceWithExactly(existsStub, key);
      existsStub.restore();
    });

    it(`should return the underlying function's result`, async () => {
      const returnValue = faker.datatype.boolean();
      const existsStub = sinon
        .stub(storage.getS3Adapter(), `exists`)
        .returns(new Promise<boolean>((resolve) => resolve(returnValue)));

      expect(await storage.exists(faker.datatype.uuid())).toBe(returnValue);
      existsStub.restore();
    });
  });

  describe(`readDir`, () => {
    it(`should invoke adapter's readDir function with the right parameters`, async () => {
      const readDirStub = sinon.stub(storage.getS3Adapter(), `readDir`);
      const prefix = faker.datatype.uuid();
      await storage.readDir(prefix);

      sinon.assert.calledOnceWithExactly(readDirStub, prefix);
      readDirStub.restore();
    });

    it(`should return the list of keys`, async () => {
      const keys = [faker.datatype.uuid(), faker.datatype.uuid()];
      const readDirStub = sinon
        .stub(storage.getS3Adapter(), `readDir`)
        .returns(new Promise((resolve) => resolve(keys)));
      const result = await storage.readDir(faker.datatype.uuid());

      expect(result).toBe(keys);
      readDirStub.restore();
    });
  });

  describe(`mkdir`, () => {
    it(`should invoke adapter's mkdir function with the right parameters`, async () => {
      const key = faker.datatype.uuid();
      const mkdirStub = sinon.stub(storage.getS3Adapter(), `mkdir`);
      await storage.mkdir(key);
      sinon.assert.calledOnceWithExactly(mkdirStub, key);
      mkdirStub.restore();
    });
  });

  describe(`rmdir`, () => {
    it(`should invoke adapter's rmdir function with the right parameters`, async () => {
      const key = faker.datatype.uuid();
      const forceDelete = faker.datatype.boolean();
      const rmdirStub = sinon.stub(storage.getS3Adapter(), `rmdir`);
      await storage.rmdir(key, forceDelete);
      sinon.assert.calledOnceWithExactly(rmdirStub, key, forceDelete);
      rmdirStub.restore();
    });
  });

  describe(`readFile`, () => {
    it(`should invoke adapter's readFile function with the right parameters`, async () => {
      const readFileStub = sinon.stub(storage.getS3Adapter(), `readFile`);
      const key = faker.datatype.uuid();
      await storage.readFile(key);
      sinon.assert.calledOnceWithExactly(readFileStub, key);
      readFileStub.restore();
    });

    it(`should return buffer of the file content`, async () => {
      const fileContent = faker.lorem.sentence();
      const readFileStub = sinon
        .stub(storage.getS3Adapter(), `readFile`)
        .returns(
          new Promise<Buffer>((resolve) => resolve(Buffer.from(fileContent)))
        );
      const result = await storage.readFile(faker.datatype.uuid());
      expect(result.toString()).toBe(fileContent);
      readFileStub.restore();
    });
  });

  describe(`isFile`, () => {
    it(`should invoke adapter's isFile function with the right parameters`, async () => {
      const key = faker.datatype.uuid();
      const isFileStub = sinon.stub(storage.getS3Adapter(), `isFile`);
      await storage.isFile(key);
      sinon.assert.calledOnceWithExactly(isFileStub, key);
      isFileStub.restore();
    });

    it(`should return the value of the underlying function`, async () => {
      const returnValue = faker.datatype.boolean();
      const isFileStub = sinon
        .stub(storage.getS3Adapter(), `isFile`)
        .returns(new Promise<boolean>((resolve) => resolve(returnValue)));
      expect(await storage.isFile(faker.datatype.uuid())).toBe(returnValue);
      isFileStub.restore();
    });
  });

  describe(`isDir`, () => {
    it(`should invoke adapter's isDir function with the right parameters`, async () => {
      const key = faker.datatype.uuid();
      const isDirStub = sinon.stub(storage.getS3Adapter(), `isDir`);
      await storage.isDir(key);
      sinon.assert.calledOnceWithExactly(isDirStub, key);
      isDirStub.restore();
    });

    it(`should return the output of the underlying function`, async () => {
      const output = faker.datatype.boolean();
      const isDirStub = sinon
        .stub(storage.getS3Adapter(), `isDir`)
        .returns(new Promise<boolean>((resolve) => resolve(output)));
      expect(await storage.isDir(faker.datatype.uuid())).toBe(output);
      isDirStub.restore();
    });
  });
});
