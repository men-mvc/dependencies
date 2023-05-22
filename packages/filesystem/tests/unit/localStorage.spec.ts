import sinon, { createSandbox, SinonSandbox, SinonStub } from 'sinon';
import { faker } from '@faker-js/faker';
import { FileSystemDriver } from '@men-mvc/config';
import {
  getServerDirectory,
  readStreamAsBuffer,
  replaceRouteParams,
  setServerDirectory
} from '@men-mvc/foundation';
import fs from 'fs';
import path from 'path';
import stream from 'stream';
import {
  getPublicStorageDirname,
  getPrivateStorageDirname,
  getStorageDirectory,
  LocalStorage,
  ReadStreamOptions,
  getPathInStorage,
  getPrivateStorageDirectory,
  getPublicStorageDirectory,
  removePublicStorageDirnameFrom
} from '../../src';
import { delay, generateBaseConfig } from '../testUtilities';
import { viewLocalSignedUrlRoute } from '../../src/localFileSignedUrlHandler';
import * as utilities from '../../src/utilities/utilities';
import * as foundation from '../../src/foundation';

const localStorage = new LocalStorage();
const fakeFileContent: string = faker.lorem.paragraph();
const serverDirectoryBeforeTests = getServerDirectory();
const testServerDir = process.cwd();
const testStorageDir = path.join(testServerDir, `storage`);
describe(`LocalStorage Utility`, () => {
  let sandbox: SinonSandbox;
  beforeAll(() => {
    setServerDirectory(testServerDir);
  });
  afterAll(() => {
    setServerDirectory(serverDirectoryBeforeTests);
  });
  beforeEach(() => {
    sandbox = createSandbox();
    createDirectoryIfNotExist(testStorageDir);
    createDirectoryIfNotExist(
      path.join(testStorageDir, getPublicStorageDirname())
    );
    createDirectoryIfNotExist(
      path.join(testStorageDir, getPrivateStorageDirname())
    );
  });
  afterEach(() => {
    sandbox.restore();
    localStorage.clearInstance();
    localStorage.clearSignerClient();
    deleteDirectoryIfExists(testStorageDir);
  });

  describe(`getSignerClient`, () => {
    it(`should always return the same instance`, () => {
      expect(localStorage.getSignerClient()).toBe(
        localStorage.getSignerClient()
      );
    });
  });

  describe(`buildUrlToBeSigned`, () => {
    it(`should return app base url + route to view local signed url providing param placeholder with value`, () => {
      const appBaseUrl = faker.internet.url();
      const filepath = faker.system.filePath();
      sandbox.stub(foundation, `getAppBaseUrl`).returns(appBaseUrl);
      expect(localStorage.buildUrlToBeSigned(filepath)).toBe(
        `${appBaseUrl}/private-file/view/${encodeURIComponent(filepath)}`
      );
    });
  });

  describe(`getSignedUrl`, () => {
    const appBaseUrl = faker.internet.url();

    beforeEach(() => {
      sandbox.stub(foundation, `getAppBaseUrl`).returns(appBaseUrl);
    });

    it(`should return signed url`, () => {
      const localSignerConfig = {
        signedUrlDurationInSeconds: 120,
        urlSignerSecret: `test-signer-secret`
      };
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            storageDriver: FileSystemDriver.local,
            local: localSignerConfig
          }
        })
      );
      const filepath = faker.system.filePath();

      const result = localStorage.getSignedUrl(filepath, 150);

      expect(
        result.includes(
          `${appBaseUrl}${replaceRouteParams(viewLocalSignedUrlRoute, {
            filepath: encodeURIComponent(filepath)
          })}`
        )
      ).toBeTruthy();
      expect(result.includes(`?hash=`)).toBeTruthy();
    });

    it(`should use duration passed as the parameter`, () => {
      const signSpy = sandbox.spy(localStorage.getSignerClient(), `sign`);
      const localSignerConfig = {
        signedUrlDurationInSeconds: 120,
        urlSignerSecret: `test-signer-secret`
      };
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            storageDriver: FileSystemDriver.local,
            local: localSignerConfig
          }
        })
      );
      const filepath = faker.system.filePath();

      localStorage.getSignedUrl(filepath, 150);

      sinon.assert.calledOnceWithExactly(
        signSpy,
        localStorage.buildUrlToBeSigned(filepath),
        {
          method: `GET`,
          ttl: 150
        }
      );
    });

    it(`should use duration from the config`, () => {
      const signSpy = sandbox.spy(localStorage.getSignerClient(), `sign`);
      const localSignerConfig = {
        signedUrlDurationInSeconds: 130,
        urlSignerSecret: `test-signer-secret`
      };
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            storageDriver: FileSystemDriver.local,
            local: localSignerConfig
          }
        })
      );
      const filepath = faker.system.filePath();

      localStorage.getSignedUrl(filepath);

      sinon.assert.calledOnceWithExactly(
        signSpy,
        localStorage.buildUrlToBeSigned(filepath),
        {
          method: `GET`,
          ttl: 130
        }
      );
    });

    it(`should use the default duration`, () => {
      const signSpy = sandbox.spy(localStorage.getSignerClient(), `sign`);
      const localSignerConfig = {
        signedUrlDurationInSeconds: undefined,
        urlSignerSecret: `test-signer-secret`
      };
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            storageDriver: FileSystemDriver.local,
            local: localSignerConfig
          }
        })
      );
      const filepath = faker.system.filePath();

      localStorage.getSignedUrl(filepath);
      sinon.assert.calledOnceWithExactly(
        signSpy,
        localStorage.buildUrlToBeSigned(filepath),
        {
          method: `GET`,
          ttl: 3600
        }
      );
    });
  });

  describe(`verifySignedUrl`, () => {
    const appBaseUrl = faker.internet.url();

    beforeEach(() => {
      sandbox.stub(foundation, `getAppBaseUrl`).returns(appBaseUrl);
    });

    it(`should return true when the signed url is valid`, () => {
      const signedUrl = localStorage.getSignedUrl(faker.datatype.uuid(), 5);
      expect(localStorage.verifySignedUrl(signedUrl)).toBeTruthy();
    });

    it(`should return false when the signed url is not a valid signed url`, () => {
      const url = faker.internet.url();
      expect(localStorage.verifySignedUrl(url)).toBeFalsy();
    });

    it(`should return false when the signed url is already expired`, async () => {
      const signedUrl = localStorage.getSignedUrl(faker.datatype.uuid(), 1);
      await delay(2000);
      expect(localStorage.verifySignedUrl(signedUrl)).toBeFalsy();
    });
  });

  describe(`getPublicUrl`, () => {
    it(`should return app base url + filepath`, () => {
      const baseUrl = `http://localhost`;
      const filename = path.join(
        getPublicStorageDirname(),
        `${faker.datatype.uuid()}.png`
      );
      sandbox.stub(foundation, `getAppBaseUrl`).returns(baseUrl);
      expect(localStorage.getPublicUrl(filename)).toBe(
        `${baseUrl}/${removePublicStorageDirnameFrom(filename)}`
      );
    });

    it(`should remove leading file separator`, () => {
      const baseUrl = `http://localhost`;
      const filename = path.join(
        getPublicStorageDirname(),
        `${faker.datatype.uuid()}.png`
      );
      sandbox.stub(foundation, `getAppBaseUrl`).returns(baseUrl);
      expect(localStorage.getPublicUrl(`/${filename}`)).toBe(
        `${baseUrl}/${removePublicStorageDirnameFrom(filename)}`
      );
    });
  });

  describe(`getAbsolutePath`, () => {
    it(`should prepend storage path - private file`, () => {
      const filepath = path.join(
        getPrivateStorageDirname(),
        faker.system.fileName()
      );
      expect(localStorage.getAbsolutePath(filepath)).toBe(
        path.join(getStorageDirectory(), filepath)
      );
    });

    it(`should prepend storage path - public file`, () => {
      const filepath = path.join(
        getPublicStorageDirname(),
        faker.system.fileName()
      );
      expect(localStorage.getAbsolutePath(filepath)).toBe(
        path.join(getStorageDirectory(), filepath)
      );
    });
  });

  describe(`readDir`, () => {
    it(`should list down the direct child files and directories in the directory`, async () => {
      createFileInTestStorage(`file1.txt`);
      createFileInTestStorage(`file2.txt`);

      const subDir = `subDir`;
      createDirectoryIfNotExist(path.join(testStorageDir, subDir));
      createFileInTestStorage(path.join(subDir, `file3.txt`)); // to make sure that it does not list the files in sub dir

      const result = await localStorage.readDir('/');

      expect(result.length).toBe(5); // ! +2 because men-public and men-private are also included - those dirs are created in beforeEach hook
      expect(result[0]).toBe(`file1.txt`);
      expect(result[1]).toBe(`file2.txt`);
      expect(result[2]).toBe(`men-private`);
      expect(result[3]).toBe(`men-public`);
      expect(result[4]).toBe(`subDir`);
    });
  });

  describe(`readFile`, () => {
    it(`should read and return file's content as buffer`, async () => {
      const filepath = getPathInStorage(`${faker.datatype.uuid()}.txt`);
      createFileInTestStorage(filepath);
      const result = await localStorage.readFile(filepath);
      expect(result instanceof Buffer).toBeTruthy();
      expect(result.toString()).toBe(fakeFileContent);
    });

    it(`should invoke readFileAsync with the right options`, async () => {
      const absoluteFilepath = path.join(
        testStorageDir,
        getPublicStorageDirname(),
        `test.txt`
      );
      const readFileAsyncStub = sinon
        .stub(utilities, 'readFileAsync')
        .returns(Promise.resolve(Buffer.from(fakeFileContent)));
      await localStorage.readFile(
        path.join(getPublicStorageDirname(), `test.txt`),
        {
          encoding: `utf-8`
        }
      );
      sinon.assert.calledOnceWithExactly(readFileAsyncStub, absoluteFilepath, {
        encoding: `utf-8`
      });
      readFileAsyncStub.restore();
    });
  });

  describe(`createReadStream`, () => {
    it(`should return readable stream of the file`, async () => {
      const filename = `test.txt`;
      createFileInTestStorage(path.join(getPrivateStorageDirname(), filename));
      const stream = await localStorage.createReadStream(
        path.join(getPrivateStorageDirname(), filename)
      );
      expect(stream instanceof fs.ReadStream).toBeTruthy();
      const buffer = await readStreamAsBuffer(stream);
      expect(buffer.toString()).toBe(fakeFileContent);
    });

    it(`should pass the right ReadStreamOptions`, async () => {
      const createReadStreamStub = sandbox.stub(fs, `createReadStream`);
      const fakeCreateReadStreamFunc = jest
        .fn()
        .mockImplementation((filepath, options) => {
          return new Promise<fs.ReadStream>((resolve) => {
            let s = new stream.Readable();
            s.push('Wai');
            s.push(null);
            return resolve(s as fs.ReadStream);
          });
        });
      createReadStreamStub.callsFake(fakeCreateReadStreamFunc);
      const filename = `test.txt`;
      const absoluteFilepath = path.join(
        testStorageDir,
        getPrivateStorageDirname(),
        filename
      );
      createFileInTestStorage(path.join(getPrivateStorageDirname(), filename));
      const options: ReadStreamOptions = {
        encoding: `utf-8`,
        highWaterMark: 16
      };
      await localStorage.createReadStream(
        path.join(getPrivateStorageDirname(), filename),
        options
      );
      expect(fakeCreateReadStreamFunc.mock.calls.length).toBe(1);
      const funCall = fakeCreateReadStreamFunc.mock.calls[0];
      expect(funCall[0]).toBe(absoluteFilepath);
      expect(funCall[1].encoding).toBe(options.encoding);
      expect(funCall[1].highWaterMark).toBe(options.highWaterMark);
    });
  });

  describe(`writeFile`, () => {
    it(`should create file with the content`, async () => {
      const expectedContent = faker.lorem.paragraph(2);
      const filename = `test.txt`;
      const expectedAbsoluteFilepath = path.join(
        testStorageDir,
        getPrivateStorageDirname(),
        filename
      );
      await localStorage.writeFile(filename, expectedContent);

      expect(fs.existsSync(expectedAbsoluteFilepath)).toBeTruthy();
      const actualContent = fs.readFileSync(expectedAbsoluteFilepath, {
        encoding: 'utf-8'
      });
      expect(actualContent).toBe(expectedContent);
    });

    it(`should update the existing file content`, async () => {
      const filename = `existing-file.txt`;
      createFileInTestStorage(path.join(getPrivateStorageDirname(), filename));
      const expectedContent = faker.lorem.paragraphs(4);
      await localStorage.writeFile(filename, expectedContent);
      const actualContent = fs.readFileSync(
        path.join(testStorageDir, getPrivateStorageDirname(), filename),
        {
          encoding: 'utf-8'
        }
      );
      expect(actualContent).toBe(expectedContent);
    });

    it(`should write files with the right options`, async () => {
      const writeFileAsyncStub = sandbox.stub(utilities, 'writeFileAsync');
      const filename = `testing.txt`;
      const content = faker.lorem.words(4);
      const options = 'base64';
      await localStorage.writeFile(filename, content, options);
      sinon.assert.calledOnceWithExactly(
        writeFileAsyncStub,
        path.join(testStorageDir, getPrivateStorageDirname(), filename),
        content,
        options
      );
    });

    it(`should return expected result`, async () => {
      const expectedContent = faker.lorem.paragraph(2);
      const filename = `test.txt`;
      const result = await localStorage.writeFile(filename, expectedContent);

      expect(result.pathInStorage).toBe(
        path.join(getPrivateStorageDirname(), filename)
      );
      expect(result.absoluteFilepath).toBe(
        path.join(testStorageDir, getPrivateStorageDirname(), filename)
      );
      expect(result.ETag).toBeUndefined();
      expect(result.$metadata).toBeUndefined();
      expect(result.ServerSideEncryption).toBeUndefined();
      expect(result.VersionId).toBeUndefined();
    });
  });

  describe(`writeFilePublicly`, () => {
    it(`should create file in the public storage`, async () => {
      const expectedContent = faker.lorem.paragraph(2);
      const filename = `test.txt`;
      await localStorage.writeFilePublicly(filename, expectedContent);
      const expectedAbsoluteFilepath = path.join(
        testStorageDir,
        getPublicStorageDirname(),
        filename
      );

      expect(fs.existsSync(expectedAbsoluteFilepath)).toBeTruthy();
      const actualContent = fs.readFileSync(expectedAbsoluteFilepath, {
        encoding: 'utf-8'
      });
      expect(actualContent).toBe(expectedContent);
    });

    it(`should return the created file locations`, async () => {
      const expectedContent = faker.lorem.paragraph(2);
      const filename = `test.txt`;
      const result = await localStorage.writeFilePublicly(
        filename,
        expectedContent
      );

      expect(result.pathInStorage).toBe(
        path.join(getPublicStorageDirname(), filename)
      );
      expect(result.absoluteFilepath).toBe(
        path.join(testStorageDir, getPublicStorageDirname(), filename)
      );
    });

    it(`should invoke writeFileAsync with the right options`, async () => {
      const writeFileAsyncStub = sandbox.stub(utilities, 'writeFileAsync');
      const filename = `testing.txt`;
      const content = faker.lorem.words(4);
      const options = 'base64';
      await localStorage.writeFilePublicly(filename, content, options);
      sinon.assert.calledOnceWithExactly(
        writeFileAsyncStub,
        path.join(testStorageDir, getPublicStorageDirname(), filename),
        content,
        options
      );
    });
  });

  describe(`deleteFile`, () => {
    it(`should delete the local file`, async () => {
      const filename = `${faker.datatype.uuid()}.txt`;
      const absolutePath = path.join(
        testStorageDir,
        getPrivateStorageDirname(),
        filename
      );
      createFileInTestStorage(path.join(getPrivateStorageDirname(), filename));
      expect(fs.existsSync(absolutePath)).toBeTruthy();
      await localStorage.deleteFile(
        path.join(getPrivateStorageDirname(), filename)
      );
      expect(fs.existsSync(absolutePath)).toBeFalsy();
    });
  });

  describe(`exists`, () => {
    it(`should return true if the file exist`, async () => {
      const filename = `${faker.datatype.uuid()}.txt`;
      createFileInTestStorage(path.join(getPrivateStorageDirname(), filename));

      expect(
        await localStorage.exists(
          path.join(getPrivateStorageDirname(), filename)
        )
      ).toBeTruthy();
    });

    it(`should return false if the file does not exist`, async () => {
      expect(
        await localStorage.exists(`${faker.datatype.uuid()}.txt`)
      ).toBeFalsy();
    });

    it(`should return true if the directory exists`, async () => {
      const dirname = faker.datatype.uuid();
      const absolutePath = path.join(
        testStorageDir,
        getPrivateStorageDirname(),
        dirname
      );
      await fs.mkdirSync(absolutePath);
      expect(
        await localStorage.exists(
          path.join(getPrivateStorageDirname(), dirname)
        )
      ).toBeTruthy();
    });

    it(`should return false if the directory does not exist`, async () => {
      expect(await localStorage.exists(`doesnotexist`)).toBeFalsy();
    });
  });

  describe(`rename`, () => {
    it(`should rename file`, async () => {
      const filename = `${faker.datatype.uuid()}.txt`;
      const newFilename = `${faker.datatype.uuid()}.txt`;
      createFileInTestStorage(filename);
      await localStorage.rename(filename, newFilename);
      expect(
        fs.existsSync(path.join(testStorageDir, newFilename))
      ).toBeTruthy();
      expect(fs.existsSync(path.join(testStorageDir, filename))).toBeFalsy();
      const content = fs.readFileSync(path.join(testStorageDir, newFilename), {
        encoding: 'utf-8'
      });
      expect(content).toBe(fakeFileContent);
    });

    it(`should rename directory`, async () => {
      const dirname = faker.datatype.uuid();
      const absolutePath = path.join(testStorageDir, dirname);
      const newDirname = faker.datatype.uuid();
      await fs.mkdirSync(absolutePath);
      await localStorage.rename(dirname, newDirname);
      expect(fs.existsSync(path.join(testStorageDir, newDirname))).toBeTruthy();
    });
  });

  describe('copy', () => {
    it('should create a copy fil with the same content with the new filename', async () => {
      const from = `${faker.datatype.uuid()}.txt`;
      const to = `${faker.datatype.uuid()}.txt`;
      createFileInTestStorage(from);
      const absoluteTo = path.join(testStorageDir, to);

      await localStorage.copy(from, to);

      const toContent = fs.readFileSync(absoluteTo);

      expect(fs.existsSync(absoluteTo)).toBeTruthy();
      expect(toContent.toString()).toBe(fakeFileContent);
    });

    it('should not delete the source file after the copy is created', async () => {
      const from = `${faker.datatype.uuid()}.txt`;
      const to = `${faker.datatype.uuid()}.txt`;
      createFileInTestStorage(from);

      await localStorage.copy(from, to);

      const absoluteFrom = path.join(testStorageDir, from);
      const fromContent = fs.readFileSync(absoluteFrom);
      expect(fs.existsSync(absoluteFrom)).toBeTruthy();
      expect(fromContent.toString()).toBe(fakeFileContent);
    });

    it('should not invoke copyFileAsync when source and destination filenames are the same', async () => {
      const copyFileAsyncSpy = sandbox.spy(utilities, 'copyFileAsync');
      const from = 'from.txt';
      createFileInTestStorage(from);
      await localStorage.copy(from, from);

      sinon.assert.notCalled(copyFileAsyncSpy);
    });
  });

  describe(`mkdir`, () => {
    it(`should create directory`, async () => {
      const dirname = faker.datatype.uuid();
      await localStorage.mkdir(dirname);
      expect(fs.existsSync(path.join(testStorageDir, dirname))).toBeTruthy();
    });

    it(`should create directory recursively`, async () => {
      const dirname = path.join(faker.datatype.uuid(), faker.datatype.uuid());
      await localStorage.mkdir(dirname);
      expect(fs.existsSync(path.join(testStorageDir, dirname))).toBeTruthy();
    });

    it(`should remove leading path sep`, async () => {
      const removeLeadingPathSpy = sandbox.spy(
        utilities,
        `removeLeadingPathSep`
      );
      const dirname = faker.datatype.uuid();
      await localStorage.mkdir(dirname);
      sinon.assert.calledOnceWithExactly(removeLeadingPathSpy, dirname);
    });

    it(`should return the path without leading path sep`, async () => {
      const dirname = faker.datatype.uuid();
      const dirWithLeadingPathSep = `${path.sep}${dirname}`;
      const result = await localStorage.mkdir(dirWithLeadingPathSep);
      expect(result).toBe(dirname);
    });
  });

  describe(`mkdirPublic`, () => {
    it(`should recursively create the directory in public storage folder`, async () => {
      const dir = path.join(faker.datatype.uuid(), faker.datatype.uuid());
      await localStorage.mkdirPublic(dir);
      expect(
        fs.existsSync(path.join(getPublicStorageDirectory(), dir))
      ).toBeTruthy();
    });

    it(`should remove leading file sep`, async () => {
      const removeLeadingPathSepSpy = sandbox.spy(
        utilities,
        `removeLeadingPathSep`
      );
      const dir = path.join(faker.datatype.uuid(), faker.datatype.uuid());
      await localStorage.mkdirPublic(dir);
      sinon.assert.calledOnceWithExactly(removeLeadingPathSepSpy, dir);
    });

    it(`should return path in storage`, async () => {
      const dir = path.join(faker.datatype.uuid(), faker.datatype.uuid());
      const result = await localStorage.mkdirPublic(dir);
      expect(result).toBe(path.join(getPublicStorageDirname(), dir));
    });
  });

  describe(`mkdirPrivate`, () => {
    it(`should recursively create the directory in private storage folder`, async () => {
      const dir = path.join(faker.datatype.uuid(), faker.datatype.uuid());
      await localStorage.mkdirPrivate(dir);
      expect(
        fs.existsSync(path.join(getPrivateStorageDirectory(), dir))
      ).toBeTruthy();
    });

    it(`should remove leading file sep`, async () => {
      const removeLeadingPathSepSpy = sandbox.spy(
        utilities,
        `removeLeadingPathSep`
      );
      const dir = path.join(faker.datatype.uuid(), faker.datatype.uuid());
      await localStorage.mkdirPrivate(dir);
      sinon.assert.calledOnceWithExactly(removeLeadingPathSepSpy, dir);
    });

    it(`should return path in storage`, async () => {
      const dir = path.join(faker.datatype.uuid(), faker.datatype.uuid());
      const result = await localStorage.mkdirPrivate(dir);
      expect(result).toBe(path.join(getPrivateStorageDirname(), dir));
    });
  });

  describe(`rmdir`, () => {
    it(`should delete directory`, async () => {
      const dirname = faker.datatype.uuid();
      const absolutePath = path.join(testStorageDir, dirname);
      fs.mkdirSync(absolutePath);
      expect(fs.existsSync(absolutePath)).toBeTruthy();
      await localStorage.rmdir(dirname);
      expect(fs.existsSync(absolutePath)).toBeFalsy();
    });

    it(`should not delete directory and throw error instead by default when there is a file in it`, async () => {
      const dirname = faker.datatype.uuid();
      fs.mkdirSync(path.join(testStorageDir, dirname));
      createFileInTestStorage(
        path.join(dirname, `${faker.datatype.uuid()}.txt`)
      );
      await expect(localStorage.rmdir(dirname)).rejects.toThrow(`ENOTEMPTY`);
    });

    it(`should delete the directory with files in it when forceDelete flag is true`, async () => {
      const dirname = faker.datatype.uuid();
      const absolutePath = path.join(testStorageDir, dirname);
      fs.mkdirSync(absolutePath);
      createFileInTestStorage(
        path.join(dirname, `${faker.datatype.uuid()}.txt`)
      );
      await localStorage.rmdir(dirname, true);
      expect(fs.existsSync(absolutePath)).toBeFalsy();
    });
  });

  describe(`isDir`, () => {
    it(`should return true when the path is directory`, async () => {
      const dirname = faker.datatype.uuid();
      fs.mkdirSync(path.join(testStorageDir, dirname));
      expect(await localStorage.isDir(dirname)).toBeTruthy();
    });

    it(`should return false when the path is file`, async () => {
      const filename = faker.datatype.uuid();
      createFileInTestStorage(filename);
      expect(await localStorage.isDir(filename)).toBeFalsy();
    });

    it(`should throw error when the file does not exist`, async () => {
      await expect(localStorage.isDir(`i-do-not-exist`)).rejects.toThrow(
        `ENOENT`
      );
    });
  });

  describe(`isFile`, () => {
    it(`should return true when the path is file`, async () => {
      const filename = `${faker.datatype.uuid()}.txt`;
      createFileInTestStorage(filename);
      expect(await localStorage.isFile(filename)).toBeTruthy();
    });

    it(`should return false when the path is directory`, async () => {
      const dirname = faker.datatype.uuid();
      fs.mkdirSync(path.join(testStorageDir, dirname));
      expect(await localStorage.isFile(dirname)).toBeFalsy();
    });

    it(`should throw error when the dir does not exist`, async () => {
      await expect(localStorage.isFile(`i-do-not-exist.txt`)).rejects.toThrow(
        `ENOENT`
      );
    });
  });

  describe(`deleteFiles`, () => {
    it(`should delete the multiple files`, async () => {
      const file1name = `${faker.datatype.uuid()}.txt`;
      const file2name = `${faker.datatype.uuid()}.txt`;
      createFileInTestStorage(file1name);
      createFileInTestStorage(file2name);

      expect(fs.existsSync(path.join(testStorageDir, file1name))).toBeTruthy();
      expect(fs.existsSync(path.join(testStorageDir, file2name))).toBeTruthy();

      await localStorage.deleteFiles([file1name, file2name]);

      expect(fs.existsSync(path.join(testStorageDir, file1name))).toBeFalsy();
      expect(fs.existsSync(path.join(testStorageDir, file2name))).toBeFalsy();
    });

    it(`should not delete the other files`, async () => {
      const file1name = `${faker.datatype.uuid()}.txt`;
      const file2name = `${faker.datatype.uuid()}.txt`;
      createFileInTestStorage(file1name);
      createFileInTestStorage(file2name);

      expect(fs.existsSync(path.join(testStorageDir, file1name))).toBeTruthy();

      await localStorage.deleteFiles([file1name]);

      expect(fs.existsSync(path.join(testStorageDir, file1name))).toBeFalsy();
      expect(fs.existsSync(path.join(testStorageDir, file2name))).toBeTruthy();
    });
  });

  // returns absolute path
  const createFileInTestStorage = (filename: string): void => {
    const filepath = path.join(testStorageDir, filename);
    fs.writeFileSync(filepath, fakeFileContent);
  };

  const createDirectoryIfNotExist = (dirname: string): void => {
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname);
    }
  };

  const deleteDirectoryIfExists = (dirpath: string): void => {
    if (fs.existsSync(dirpath)) {
      fs.rmdirSync(dirpath, { recursive: true });
    }
  };
});
