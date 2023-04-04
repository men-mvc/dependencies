import sinon, { SinonStub } from 'sinon';
import { faker } from '@faker-js/faker';
import { readStreamAsBuffer } from '@men-mvc/foundation';
import fs from 'fs';
import path from 'path';
import stream from 'stream';
import { LocalStorage, ReadStreamOptions } from '../../src';
import * as utilities from '../../src/utilities';

const localStorage = new LocalStorage();
const fakeFileContent: string = faker.lorem.paragraph();
class FakeFileError extends Error {
  public code: string | null = null;
  constructor(message: string) {
    super(message);
  }
}
const testStoragePath = path.join(__dirname, 'testStorage');
describe(`LocalStorage Utility`, () => {
  let getAppStorageDirectoryStub: SinonStub;
  beforeEach(() => {
    getAppStorageDirectoryStub = sinon
      .stub(utilities, `getAppStorageDirectory`)
      .returns(testStoragePath);
    createDirectoryIfNotExist(testStoragePath);
  });
  afterEach(() => {
    deleteDirectoryIfExists(testStoragePath);
    if (getAppStorageDirectoryStub) {
      getAppStorageDirectoryStub.restore();
    }
  });

  describe(`createStorageCompatiblePath`, () => {
    it(`should return storage path + filepath`, () => {
      expect(localStorage.createStorageCompatiblePath("testing.txt")).toBe(path.join(testStoragePath, "testing.txt"));
    });

    it(`should remove a leading fore slash`, () => {
      expect(localStorage.createStorageCompatiblePath("/testing.txt")).toBe(path.join(testStoragePath, "testing.txt"));
    });
  });

  describe(`getAbsolutePath`, () => {
    it(`should return prepend storage path`, () => {
      const filename = `${faker.datatype.uuid()}.txt`;
      expect(localStorage.getAbsolutePath(filename)).toBe(
        path.join(testStoragePath, filename)
      );
    });
  });

  describe(`readDir`, () => {
    it(`should list down the direct child files and directories in the directory`, async () => {
      createFileInTestStorage(`file1.txt`);
      createFileInTestStorage(`file2.txt`);

      const subDir = `subDir`;
      createDirectoryIfNotExist(path.join(testStoragePath, subDir));
      createFileInTestStorage(path.join(subDir, `file3.txt`)); // to make sure that it does not list the files in sub dir

      const result = await localStorage.readDir('/');

      expect(result.length).toBe(3);
      expect(result[0]).toBe(`file1.txt`);
      expect(result[1]).toBe(`file2.txt`);
      expect(result[2]).toBe(`subDir`);
    });

    it(`should throw error when directory does not exist`, async () => {
      await expect(
        localStorage.readDir(path.join(testStoragePath, `i-do-not-exist`))
      ).rejects.toThrow(`ENOENT`);
    });
  });

  describe(`readFile`, () => {
    it(`should read and return file's content as buffer`, async () => {
      const filename = `testing.txt`;
      createFileInTestStorage(filename);
      const result = await localStorage.readFile(filename);
      expect(result instanceof Buffer).toBeTruthy();
      expect(result.toString()).toBe(fakeFileContent);
    });

    it(`should throw error when the file does not exist`, async () => {
      await expect(
        localStorage.readFile(path.join(testStoragePath, `i-do-not-exist.txt`))
      ).rejects.toThrow(`ENOENT`);
    });

    it(`should invoke readFileAsync with the right options`, async () => {
      const filename = `test.txt`;
      const absoluteFilepath = path.join(testStoragePath, `test.txt`);
      const readFileAsyncStub = sinon
        .stub(utilities, 'readFileAsync')
        .returns(Promise.resolve(Buffer.from(fakeFileContent)));
      await localStorage.readFile(filename, {
        encoding: `utf-8`
      });
      sinon.assert.calledOnceWithExactly(readFileAsyncStub, absoluteFilepath, {
        encoding: `utf-8`
      });
      readFileAsyncStub.restore();
    });
  });

  describe(`createReadStream`, () => {
    it(`should return readable stream of the file`, async () => {
      const filename = `test.txt`;
      createFileInTestStorage(filename);
      const stream = await localStorage.createReadStream(filename);
      expect(stream instanceof fs.ReadStream).toBeTruthy();
      const buffer = await readStreamAsBuffer(stream);
      expect(buffer.toString()).toBe(fakeFileContent);
    });

    it(`should pass the right ReadStreamOptions`, async () => {
      const createReadStreamStub = sinon.stub(fs, `createReadStream`);
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
      const absoluteFilepath = path.join(testStoragePath, filename);
      createFileInTestStorage(filename);
      const options: ReadStreamOptions = {
        encoding: `utf-8`,
        highWaterMark: 16
      };
      await localStorage.createReadStream(filename, options);
      expect(fakeCreateReadStreamFunc.mock.calls.length).toBe(1);
      const funCall = fakeCreateReadStreamFunc.mock.calls[0];
      expect(funCall[0]).toBe(absoluteFilepath);
      expect(funCall[1].encoding).toBe(options.encoding);
      expect(funCall[1].highWaterMark).toBe(options.highWaterMark);
      createReadStreamStub.restore();
    });
  });

  describe(`writeFile`, () => {
    it(`should create file with the content`, async () => {
      const expectedContent = faker.lorem.paragraph(2);
      const filename = `test.txt`;
      const absoluteFilepath = path.join(testStoragePath, filename);
      await localStorage.writeFile(filename, expectedContent);

      expect(fs.existsSync(absoluteFilepath)).toBeTruthy();
      const actualContent = fs.readFileSync(absoluteFilepath, {
        encoding: 'utf-8'
      });
      expect(actualContent).toBe(expectedContent);
    });

    it(`should update the existing file content`, async () => {
      const filename = `existing-file.txt`;
      createFileInTestStorage(filename);
      const expectedContent = faker.lorem.paragraphs(4);
      await localStorage.writeFile(filename, expectedContent);
      const actualContent = fs.readFileSync(
        path.join(testStoragePath, filename),
        {
          encoding: 'utf-8'
        }
      );
      expect(actualContent).toBe(expectedContent);
    });

    it(`should write files with the right options`, async () => {
      const writeFileAsyncStub = sinon.stub(utilities, 'writeFileAsync');
      const filename = `testing.txt`;
      const content = faker.lorem.words(4);
      const options = 'base64';
      await localStorage.writeFile(filename, content, options);
      sinon.assert.calledOnceWithExactly(
        writeFileAsyncStub,
        path.join(testStoragePath, filename),
        content,
        options
      );
      writeFileAsyncStub.restore();
    });

    it(`should return expected result`, async () => {
      const expectedContent = faker.lorem.paragraph(2);
      const filename = `test.txt`;
      const result = await localStorage.writeFile(filename, expectedContent);

      expect(result.filepath).toBe(path.join(testStoragePath, filename));
      expect(result.ServerSideEncryption).toBeUndefined();
      expect(result.ETag).toBeUndefined();
      expect(result.$metadata).toBeUndefined();
      expect(result.ServerSideEncryption).toBeUndefined();
      expect(result.VersionId).toBeUndefined();
    });
  });

  describe(`deleteFile`, () => {
    it(`should delete the local file`, async () => {
      const filename = `waiyanhein-greeting.txt`;
      const absolutePath = path.join(testStoragePath, filename);
      createFileInTestStorage(filename);
      expect(fs.existsSync(absolutePath)).toBeTruthy();
      await localStorage.deleteFile(filename);
      expect(fs.existsSync(absolutePath)).toBeFalsy();
    });
  });

  describe(`exists`, () => {
    it(`should return true if the file exist`, async () => {
      const filename = `${faker.datatype.uuid()}.txt`;
      createFileInTestStorage(filename);

      expect(await localStorage.exists(filename)).toBeTruthy();
      fs.unlinkSync(path.join(testStoragePath, filename));
    });

    it(`should return false if the file does not exist`, async () => {
      expect(
        await localStorage.exists(`${faker.datatype.uuid()}.txt`)
      ).toBeFalsy();
    });

    it(`should return true if the directory exists`, async () => {
      const dirname = faker.datatype.uuid();
      const absolutePath = path.join(testStoragePath, dirname);
      await fs.mkdirSync(absolutePath);
      expect(await localStorage.exists(dirname)).toBeTruthy();
      fs.rmdirSync(absolutePath);
    });

    it(`should return false if the directory does not exist`, async () => {
      expect(await localStorage.exists(`doesnotexist`)).toBeFalsy();
    });

    it(`should throw error when the error code is not ENOENT`, async () => {
      const fakeError = new FakeFileError(`Storage is full.`);
      fakeError.code = `STORAGE_FULL`;
      const statStub = sinon.stub(fs, `stat`);
      const fakeStatFunc = jest.fn((filepath, cb) => {
        cb(fakeError);
      });
      statStub.callsFake(fakeStatFunc);
      await expect(
        localStorage.exists(`${faker.datatype.uuid()}.txt`)
      ).rejects.toThrow(fakeError.message);
      statStub.restore();
    });
  });

  describe(`rename`, () => {
    it(`should rename file`, async () => {
      const filename = `${faker.datatype.uuid()}.txt`;
      const newFilename = `${faker.datatype.uuid()}.txt`;
      createFileInTestStorage(filename);
      await localStorage.rename(filename, newFilename);
      expect(
        fs.existsSync(path.join(testStoragePath, newFilename))
      ).toBeTruthy();
      expect(fs.existsSync(path.join(testStoragePath, filename))).toBeFalsy();
      const content = fs.readFileSync(path.join(testStoragePath, newFilename), {
        encoding: 'utf-8'
      });
      expect(content).toBe(fakeFileContent);
    });

    it(`should rename directory`, async () => {
      const dirname = faker.datatype.uuid();
      const absolutePath = path.join(testStoragePath, dirname);
      const newDirname = faker.datatype.uuid();
      await fs.mkdirSync(absolutePath);
      await localStorage.rename(dirname, newDirname);
      expect(
        fs.existsSync(path.join(testStoragePath, newDirname))
      ).toBeTruthy();
    });
  });

  describe('copy', () => {
    it('should create a copy fil with the same content with the new filename', async () => {
      const from = `${faker.datatype.uuid()}.txt`;
      const to = `${faker.datatype.uuid()}.txt`;
      createFileInTestStorage(from);
      const absoluteTo = path.join(testStoragePath, to);

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

      const absoluteFrom = path.join(testStoragePath, from);
      const fromContent = fs.readFileSync(absoluteFrom);
      expect(fs.existsSync(absoluteFrom)).toBeTruthy();
      expect(fromContent.toString()).toBe(fakeFileContent);
    });

    it('should not invoke copyFileAsync when source and destination filenames are the same', async () => {
      const copyFileAsyncSpy = sinon.spy(utilities, 'copyFileAsync');
      const from = 'from.txt';
      createFileInTestStorage(from);
      await localStorage.copy(from, from);

      sinon.assert.notCalled(copyFileAsyncSpy);
      copyFileAsyncSpy.restore();
    });
  });

  describe(`mkdir`, () => {
    it(`should create directory`, async () => {
      const dirname = faker.datatype.uuid();
      await localStorage.mkdir(dirname);
      expect(fs.existsSync(path.join(testStoragePath, dirname))).toBeTruthy();
    });

    it(`should create directory recursively`, async () => {
      const dirname = path.join(faker.datatype.uuid(), faker.datatype.uuid());
      await localStorage.mkdir(dirname);
      expect(fs.existsSync(path.join(testStoragePath, dirname))).toBeTruthy();
    });
  });

  describe(`rmdir`, () => {
    it(`should delete directory`, async () => {
      const dirname = faker.datatype.uuid();
      const absolutePath = path.join(testStoragePath, dirname);
      fs.mkdirSync(absolutePath);
      expect(fs.existsSync(absolutePath)).toBeTruthy();
      await localStorage.rmdir(dirname);
      expect(fs.existsSync(absolutePath)).toBeFalsy();
    });

    it(`should not delete directory and throw error instead by default when there is a file in it`, async () => {
      const dirname = faker.datatype.uuid();
      fs.mkdirSync(path.join(testStoragePath, dirname));
      createFileInTestStorage(
        path.join(dirname, `${faker.datatype.uuid()}.txt`)
      );
      await expect(localStorage.rmdir(dirname)).rejects.toThrow(`ENOTEMPTY`);
    });

    it(`should delete the directory with files in it when forceDelete flag is true`, async () => {
      const dirname = faker.datatype.uuid();
      const absolutePath = path.join(testStoragePath, dirname);
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
      fs.mkdirSync(path.join(testStoragePath, dirname));
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
      fs.mkdirSync(path.join(testStoragePath, dirname));
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

      await localStorage.deleteFiles([file1name, file2name]);

      expect(fs.existsSync(path.join(testStoragePath, file1name))).toBeFalsy();
      expect(fs.existsSync(path.join(testStoragePath, file2name))).toBeFalsy();
    });

    it(`should not delete the other file`, async () => {
      const file1name = `${faker.datatype.uuid()}.txt`;
      const file2name = `${faker.datatype.uuid()}.txt`;
      createFileInTestStorage(file1name);
      createFileInTestStorage(file2name);

      await localStorage.deleteFiles([file1name]);

      expect(fs.existsSync(path.join(testStoragePath, file1name))).toBeFalsy();
      expect(fs.existsSync(path.join(testStoragePath, file2name))).toBeTruthy();
    });
  });

  // returns absolute path
  const createFileInTestStorage = (filename: string): void => {
    const filepath = path.join(testStoragePath, filename);
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
