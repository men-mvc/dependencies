import sinon, { SinonStub } from 'sinon';
import { faker } from '@faker-js/faker';
import path from 'path';
import {
  getServerDirectory,
  readReadableAsString,
  replaceRouteParams,
  setServerDirectory
} from '@men-mvc/foundation';
import { Buffer } from 'buffer';
import { ReadStream } from 'fs';
import { Readable } from 'stream';
import { S3Config } from '@men-mvc/config';
import { S3Storage } from '../../../src';
import {
  getPrivateStorageDirname,
  getPublicStorageDirname,
  MenS3PutObjectCommandOutput
} from '../../../src';
import { viewPublicS3ObjectRoute } from '../../../src/s3/viewPublicS3ObjectHandler';
import * as foundation from '../../../src/foundation';
import * as utilities from '../../../src/utilities/utilities';
import { generateBaseConfig } from '../../testUtilities';

const storage = new S3Storage();
const serverDirBeforeTests = getServerDirectory();
describe(`S3Storage`, () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  beforeAll(() => {
    setServerDirectory(process.cwd());
  });

  afterAll(() => {
    setServerDirectory(serverDirBeforeTests);
  });

  describe(`getSignedUrl`, () => {
    it(`should generate signed url invoking the adapter's getSignedUrl function with the right parameters`, () => {
      const fakeSignedUrl = `${faker.internet.url()}?hash=${faker.datatype.uuid()}`;
      const adapterGetSignedUrlStub = sinon
        .stub(storage.getS3Adapter(), `getSignedUrl`)
        .returns(fakeSignedUrl);
      const duration = 120;
      const key = faker.datatype.uuid();
      const result = storage.getS3Adapter().getSignedUrl(key, duration);
      expect(result).toBe(fakeSignedUrl);
      sinon.assert.calledOnceWithExactly(
        adapterGetSignedUrlStub,
        key,
        duration
      );
      adapterGetSignedUrlStub.restore();
    });
  });

  describe(`getPublicUrl`, () => {
    const fakeCloudfrontDomain = `https://cloudfront.example.com`;

    it(`should return cloudfront domain + filepath when it is using cloudfront`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            s3: {
              cloudfront: {
                domainName: fakeCloudfrontDomain
              }
            } as S3Config
          }
        })
      );
      sandbox
        .stub(storage.getS3Adapter(), `getCloudFrontDomain`)
        .returns(fakeCloudfrontDomain);
      const key = faker.datatype.uuid();
      expect(storage.getPublicUrl(key)).toBe(`${fakeCloudfrontDomain}/${key}`);
    });

    it(`should remove leading slash from the key`, () => {
      const removeLeadingPathSepStub = sandbox.spy(
        utilities,
        `removeLeadingPathSep`
      );
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            s3: {
              cloudfront: {
                domainName: fakeCloudfrontDomain
              }
            } as S3Config
          }
        })
      );
      sandbox
        .stub(storage.getS3Adapter(), `getCloudFrontDomain`)
        .returns(fakeCloudfrontDomain);
      const key = faker.datatype.uuid();
      expect(storage.getPublicUrl(`/${key}`)).toBe(
        `${fakeCloudfrontDomain}/${key}`
      );
      sinon.assert.calledOnceWithExactly(removeLeadingPathSepStub, `/${key}`);
    });

    /**
     * ! this test also ensures that the key is URL encoded.
     */
    it(`should return app base url + view public s3 object route providing key parameter with value`, async () => {
      const appBaseUrl = 'http://localhost';
      sandbox.stub(foundation, `getAppBaseUrl`).returns(appBaseUrl);
      const key = `${getPublicStorageDirname()}/${faker.datatype.uuid()}[+].png`;
      expect(storage.getPublicUrl(key)).toBe(
        `${appBaseUrl}${replaceRouteParams(viewPublicS3ObjectRoute, {
          key: encodeURIComponent(key)
        })}`
      );
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
      const createReadStreamStub = sandbox.stub(
        storage.getS3Adapter(),
        `createReadStream`
      );
      const key = faker.datatype.uuid();
      await storage.createReadStream(key);
      sinon.assert.calledOnceWithExactly(createReadStreamStub, key);
    });

    it(`should return the output of the underlying function`, async () => {
      const fileContent = faker.lorem.sentence();
      const readable = Readable.from(Buffer.from(fileContent));
      sandbox
        .stub(storage.getS3Adapter(), `createReadStream`)
        .returns(
          new Promise<ReadStream>((resolve) => resolve(readable as ReadStream))
        );
      const result = await storage.createReadStream(faker.datatype.uuid());
      expect(await readReadableAsString(result)).toBe(fileContent);
    });
  });

  describe(`copy`, () => {
    it(`should invoke adapter's copy function with the right parameters`, async () => {
      const copyStub = sandbox.stub(storage.getS3Adapter(), `copy`);
      const fromKey = faker.datatype.uuid();
      const toKey = faker.datatype.uuid();
      await storage.copy(fromKey, toKey);
      sinon.assert.calledOnceWithExactly(copyStub, fromKey, toKey);
    });
  });

  describe(`rename`, () => {
    it(`should invoke adapter's rename function with the right parameters`, async () => {
      const renameStub = sandbox.stub(storage.getS3Adapter(), `rename`);
      const fromKey = faker.datatype.uuid();
      const toKey = faker.datatype.uuid();
      await storage.rename(fromKey, toKey);
      sinon.assert.calledOnceWithExactly(renameStub, fromKey, toKey);
    });
  });

  describe(`writeFile`, () => {
    it(`should invoke adapter's writeFile function with the right parameters`, async () => {
      const writeFileStub = sandbox.stub(storage.getS3Adapter(), `writeFile`);
      const data = faker.lorem.sentence();
      const key = faker.datatype.uuid();
      await storage.writeFile(key, data);
      sinon.assert.calledOnceWithExactly(
        writeFileStub,
        path.join(getPrivateStorageDirname(), key),
        data
      );
    });

    it(`should return the created object locations`, async () => {
      const data = faker.lorem.sentence();
      const key = faker.datatype.uuid();
      const writeOutput = {
        VersionId: faker.datatype.uuid(),
        ServerSideEncryption: `AES256`
      };
      sandbox
        .stub(storage.getS3Adapter(), `writeFile`)
        .returns(
          new Promise((resolve) =>
            resolve(writeOutput as MenS3PutObjectCommandOutput)
          )
        );
      const result = await storage.writeFile(key, data);

      expect(result.pathInStorage).toBe(
        path.join(getPrivateStorageDirname(), key)
      );
      expect(result.absoluteFilepath).toBe(
        path.join(getPrivateStorageDirname(), key)
      );
      expect(result.VersionId).toBe(writeOutput.VersionId);
      expect(result.ServerSideEncryption).toBe(
        writeOutput.ServerSideEncryption
      );
    });

    it(`should remove the leading path separator`, async () => {
      const removeLeadingPathSepStub = sandbox.stub(
        utilities,
        `removeLeadingPathSep`
      );
      sandbox.stub(storage.getS3Adapter(), `writeFile`);
      const data = faker.lorem.sentence();
      const key = faker.datatype.uuid();
      await storage.writeFile(key, data);
      sinon.assert.calledOnceWithExactly(removeLeadingPathSepStub, key);
    });
  });

  describe(`writeFilePublicly`, () => {
    let writeFileStub: SinonStub;
    beforeEach(() => {
      writeFileStub = sandbox.stub(storage.getS3Adapter(), `writeFile`);
    });

    it(`should invoke adapter's writeFile function with the right parameters appending ${getPublicStorageDirname()} to the key`, async () => {
      const data = faker.lorem.sentence();
      const key = faker.datatype.uuid();
      await storage.writeFilePublicly(key, data);
      sinon.assert.calledOnceWithExactly(
        writeFileStub,
        `${getPublicStorageDirname()}/${key}`,
        data
      );
    });

    it(`should remove leading slash in the key`, async () => {
      const removeLeadingPathSepStub = sandbox.stub(
        utilities,
        `removeLeadingPathSep`
      );
      const data = faker.lorem.sentence();
      const key = `/${faker.datatype.uuid()}`;
      await storage.writeFilePublicly(key, data);
      sinon.assert.calledOnceWithExactly(removeLeadingPathSepStub, key);
    });

    it(`should return the created object locations`, async () => {
      const data = faker.lorem.sentence();
      const key = faker.datatype.uuid();
      const expectedKey = `${getPublicStorageDirname()}/${key}`;
      const result = await storage.writeFilePublicly(key, data);
      expect(result.absoluteFilepath).toBe(expectedKey);
      expect(result.pathInStorage).toBe(expectedKey);
    });
  });

  describe(`deleteFile`, () => {
    it(`should invoke adapter's deleteFile function with the right parameters`, async () => {
      const deleteFileStub = sandbox.stub(storage.getS3Adapter(), `deleteFile`);
      const key = faker.datatype.uuid();
      await storage.deleteFile(key);

      sinon.assert.calledOnceWithExactly(deleteFileStub, key);
    });
  });

  describe(`deleteFiles`, () => {
    it(`should invoke adapter's deleteFiles function with the right parameters`, async () => {
      const deleteFilesStub = sandbox.stub(
        storage.getS3Adapter(),
        `deleteFiles`
      );
      const keys = [faker.datatype.uuid(), faker.datatype.uuid()];
      await storage.deleteFiles(keys);

      sinon.assert.calledOnceWithExactly(deleteFilesStub, keys);
    });
  });

  describe(`exists`, () => {
    it(`should invoke adapter's exists function with the right parameters`, async () => {
      const existsStub = sandbox.stub(storage.getS3Adapter(), `exists`);
      const key = faker.datatype.uuid();
      await storage.exists(key);

      sinon.assert.calledOnceWithExactly(existsStub, key);
    });

    it(`should return the underlying function's result`, async () => {
      const returnValue = faker.datatype.boolean();
      sandbox
        .stub(storage.getS3Adapter(), `exists`)
        .returns(new Promise<boolean>((resolve) => resolve(returnValue)));

      expect(await storage.exists(faker.datatype.uuid())).toBe(returnValue);
    });
  });

  describe(`readDir`, () => {
    it(`should invoke adapter's readDir function with the right parameters`, async () => {
      const readDirStub = sandbox.stub(storage.getS3Adapter(), `readDir`);
      const prefix = faker.datatype.uuid();
      await storage.readDir(prefix);

      sinon.assert.calledOnceWithExactly(readDirStub, prefix);
    });

    it(`should return the list of keys`, async () => {
      const keys = [faker.datatype.uuid(), faker.datatype.uuid()];
      sandbox
        .stub(storage.getS3Adapter(), `readDir`)
        .returns(new Promise((resolve) => resolve(keys)));
      const result = await storage.readDir(faker.datatype.uuid());

      expect(result).toBe(keys);
    });
  });

  describe(`mkdir`, () => {
    let mkdirStub: SinonStub;

    beforeEach(() => {
      mkdirStub = sandbox.stub(storage.getS3Adapter(), `mkdir`);
    });

    it(`should invoke adapter's mkdir function with the right parameters`, async () => {
      const key = faker.datatype.uuid();
      await storage.mkdir(key);
      sinon.assert.calledOnceWithExactly(mkdirStub, key);
    });

    it(`should remove leading slash`, async () => {
      const key = faker.datatype.uuid();
      const removeLeadingPathSepStub = sandbox
        .stub(utilities, `removeLeadingPathSep`)
        .returns(key);
      await storage.mkdir(key);
      sinon.assert.calledOnceWithExactly(removeLeadingPathSepStub, key);
    });

    it(`should return key without leading slash`, async () => {
      const key = faker.datatype.uuid();
      const result = await storage.mkdir(`/${key}`);
      expect(result).toBe(key);
    });
  });

  describe(`mkdirPrivate`, () => {
    let mkdirStub: SinonStub;

    beforeEach(() => {
      mkdirStub = sinon.stub(storage.getS3Adapter(), `mkdir`);
    });

    afterEach(() => {
      mkdirStub.restore();
    });

    it(`should invoke adapter's mkdir with the right parameters`, async () => {
      const key = faker.datatype.uuid();
      await storage.mkdirPrivate(key);
      sinon.assert.calledOnceWithExactly(
        mkdirStub,
        `${getPrivateStorageDirname()}/${key}`
      );
    });

    it(`should remove the leading slash`, async () => {
      const key = faker.datatype.uuid();
      const removeLeadingPathSepStub = sandbox
        .stub(utilities, `removeLeadingPathSep`)
        .returns(key);
      await storage.mkdirPrivate(key);
      sinon.assert.calledOnceWithExactly(removeLeadingPathSepStub, key);
    });

    it(`should return the key with private dirname as prefix`, async () => {
      const key = faker.datatype.uuid();
      const result = await storage.mkdirPrivate(key);
      expect(result).toBe(`${getPrivateStorageDirname()}/${key}`);
    });
  });

  describe(`mkdirPublic`, () => {
    let mkdirStub: SinonStub;

    beforeEach(() => {
      mkdirStub = sinon.stub(storage.getS3Adapter(), `mkdir`);
    });

    afterEach(() => {
      mkdirStub.restore();
    });

    it(`should invoke adapter's mkdir with the right parameters`, async () => {
      const key = faker.datatype.uuid();
      await storage.mkdirPublic(key);
      sinon.assert.calledOnceWithExactly(
        mkdirStub,
        `${getPublicStorageDirname()}/${key}`
      );
    });

    it(`should remove the leading slash`, async () => {
      const key = faker.datatype.uuid();
      const removeLeadingPathSepStub = sandbox
        .stub(utilities, `removeLeadingPathSep`)
        .returns(key);
      await storage.mkdirPublic(key);
      sinon.assert.calledOnceWithExactly(removeLeadingPathSepStub, key);
    });

    it(`should return the key with public dirname as prefix`, async () => {
      const key = faker.datatype.uuid();
      const result = await storage.mkdirPublic(key);
      expect(result).toBe(`${getPublicStorageDirname()}/${key}`);
    });
  });

  describe(`rmdir`, () => {
    it(`should invoke adapter's rmdir function with the right parameters`, async () => {
      const key = faker.datatype.uuid();
      const forceDelete = faker.datatype.boolean();
      const rmdirStub = sandbox.stub(storage.getS3Adapter(), `rmdir`);
      await storage.rmdir(key, forceDelete);
      sinon.assert.calledOnceWithExactly(rmdirStub, key, forceDelete);
    });
  });

  describe(`readFile`, () => {
    it(`should invoke adapter's readFile function with the right parameters`, async () => {
      const readFileStub = sandbox.stub(storage.getS3Adapter(), `readFile`);
      const key = faker.datatype.uuid();
      await storage.readFile(key);
      sinon.assert.calledOnceWithExactly(readFileStub, key);
    });

    it(`should return buffer of the file content`, async () => {
      const fileContent = faker.lorem.sentence();
      sandbox
        .stub(storage.getS3Adapter(), `readFile`)
        .returns(
          new Promise<Buffer>((resolve) => resolve(Buffer.from(fileContent)))
        );
      const result = await storage.readFile(faker.datatype.uuid());
      expect(result.toString()).toBe(fileContent);
    });
  });

  describe(`isFile`, () => {
    it(`should invoke adapter's isFile function with the right parameters`, async () => {
      const key = faker.datatype.uuid();
      const isFileStub = sandbox.stub(storage.getS3Adapter(), `isFile`);
      await storage.isFile(key);
      sinon.assert.calledOnceWithExactly(isFileStub, key);
    });

    it(`should return the value of the underlying function`, async () => {
      const returnValue = faker.datatype.boolean();
      sandbox
        .stub(storage.getS3Adapter(), `isFile`)
        .returns(new Promise<boolean>((resolve) => resolve(returnValue)));
      expect(await storage.isFile(faker.datatype.uuid())).toBe(returnValue);
    });
  });

  describe(`isDir`, () => {
    it(`should invoke adapter's isDir function with the right parameters`, async () => {
      const key = faker.datatype.uuid();
      const isDirStub = sandbox.stub(storage.getS3Adapter(), `isDir`);
      await storage.isDir(key);
      sinon.assert.calledOnceWithExactly(isDirStub, key);
    });

    it(`should return the output of the underlying function`, async () => {
      const output = faker.datatype.boolean();
      sandbox
        .stub(storage.getS3Adapter(), `isDir`)
        .returns(new Promise<boolean>((resolve) => resolve(output)));
      expect(await storage.isDir(faker.datatype.uuid())).toBe(output);
    });
  });
});
