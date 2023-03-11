import sinon from 'sinon';
import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';
import stream from 'stream';
import { LocalStorage, ReadStreamOptions } from '../../../src';
import { delay } from '../../testUtilities';

const localStorage = new LocalStorage();
const fakeFileContent: string = `Greeting from Wai.`;
class FakeFileError extends Error {
  public code: string | null = null;
  constructor(message: string) {
    super(message);
  }
}
const testFilesDir = path.join(__dirname, 'testFiles');
describe(`LocalStorage Utility`, () => {
  beforeEach(() => {
    createDirectoryIfNotExist(testFilesDir);
  });
  afterEach(() => {
    deleteDirectoryIfExists(testFilesDir);
  });

  describe(`readDir`, () => {
    it(`should list down the direct child files and directories in the directory`, async () => {
      createFile(`file1.txt`);
      createFile(`file2.txt`);
      const subDir = createDirectoryIfNotExist(`subDir`);
      createFile(path.join(subDir, `file3.txt`)); // to make sure that it does not list the files in sub dir

      const result = await localStorage.readDir(testFilesDir);

      expect(result.length).toBe(3);
      expect(result[0]).toBe(`file1.txt`);
      expect(result[1]).toBe(`file2.txt`);
      expect(result[2]).toBe(`subDir`);
    });

    it(`should throw error when directory does not exist`, async () => {
      try {
        await localStorage.readDir(path.join(testFilesDir, `i-do-not-exist`));
        throw new Error(`Expected error was not thrown`);
      } catch (e) {
        if (!e || typeof e !== 'object' || !(`code` in e)) {
          throw new Error(`Expected error was not thrown.`);
        }
        expect(e.code).toBe(`ENOENT`);
      }
    });
  });

  describe(`readFile`, () => {
    it(`should read and return file's content as buffer`, async () => {
      const filepath = createFile(`testing.txt`);
      const result = await localStorage.readFile(filepath);
      expect(result instanceof Buffer).toBeTruthy();
      expect(result.toString()).toBe(fakeFileContent);
    });

    it(`should throw error when the file does not exist`, async () => {
      try {
        const filepath = path.join(testFilesDir, `i-do-not-exist.txt`);
        await localStorage.readFile(filepath);
        throw new Error(`Expected error was not thrown`);
      } catch (e) {
        expect(
          typeof e === 'object' && e && `code` in e && e.code === `ENOENT`
        ).toBe(true);
      }
    });

    it(`should invoke readFile with the right options`, async () => {
      const filepath = path.join(testFilesDir, `test.txt`);
      const readFileStub = sinon.stub(fs, 'readFile');
      const fakeReadFileFunc = jest
        .fn()
        .mockImplementation((filepath, options, cb) => {
          cb(null, fakeFileContent);
        });
      readFileStub.callsFake(fakeReadFileFunc);
      await localStorage.readFile(filepath, {
        encoding: `utf-8`
      });
      expect(fakeReadFileFunc.mock.calls.length).toBe(1);
      const funCall = fakeReadFileFunc.mock.calls[0];
      expect(funCall[0]).toBe(filepath);
      expect(funCall[1].encoding).toBe(`utf-8`);
      readFileStub.restore();
    });
  });

  describe(`createReadStream`, () => {
    it(`should return readable stream of the file`, async () => {
      const filepath = createFile(`test.txt`);
      const stream = await localStorage.createReadStream(filepath);
      expect(stream instanceof fs.ReadStream).toBeTruthy();
      const buffer = await readStream(stream);
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
      const filepath = createFile(`test.txt`);
      const options: ReadStreamOptions = {
        encoding: `utf-8`,
        highWaterMark: 16
      };
      await localStorage.createReadStream(filepath, options);
      expect(fakeCreateReadStreamFunc.mock.calls.length).toBe(1);
      const funCall = fakeCreateReadStreamFunc.mock.calls[0];
      expect(funCall[0]).toBe(filepath);
      expect(funCall[1].encoding).toBe(options.encoding);
      expect(funCall[1].highWaterMark).toBe(options.highWaterMark);
      createReadStreamStub.restore();
    });
  });

  describe(`writeFile`, () => {
    it(`should create file with the content`, async () => {
      const expectedContent = faker.lorem.paragraph(2);
      const filepath = path.join(testFilesDir, `test.txt`);
      await localStorage.writeFile(filepath, expectedContent);

      expect(fs.existsSync(filepath)).toBeTruthy();
      const actualContent = fs.readFileSync(filepath, { encoding: 'utf-8' });
      expect(actualContent).toBe(expectedContent);
    });

    it(`should update the existing file content`, async () => {
      const existingFilepath = createFile(`existing-file.txt`);
      const expectedContent = faker.lorem.paragraphs(4);
      await localStorage.writeFile(existingFilepath, expectedContent);
      const actualContent = fs.readFileSync(existingFilepath, {
        encoding: 'utf-8'
      });
      expect(actualContent).toBe(expectedContent);
    });

    it(`should throw error when there is a problem writing file`, async () => {
      const fakeFileError = new FakeFileError(`Problem writing file`);
      fakeFileError.code = `DISK_FULL`;
      const writeFileStub = sinon.stub(fs, 'writeFile');
      const fakeWriteFileFunc = jest
        .fn()
        .mockImplementation((filepath, data, options, cb) => {
          cb(fakeFileError);
        });
      writeFileStub.callsFake(fakeWriteFileFunc);
      const filepath = path.join(testFilesDir, `testing.txt`);
      try {
        await localStorage.writeFile(filepath, faker.lorem.words(4));
        throw new Error(`Expected error was not thrown.`);
      } catch (e) {
        expect(
          e instanceof FakeFileError && e.code === fakeFileError.code
        ).toBe(true);
      }
      expect(fs.existsSync(filepath)).toBeFalsy();
      writeFileStub.restore();
    });

    it(`should write files with the right options`, async () => {
      const writeFileStub = sinon.stub(fs, 'writeFile');
      const fakeWriteFileFunc = jest
        .fn()
        .mockImplementation((filepath, data, options, cb) => {
          cb();
        });
      writeFileStub.callsFake(fakeWriteFileFunc);
      const filepath = path.join(testFilesDir, `testing.txt`);
      const content = faker.lorem.words(4);
      const options = 'base64';
      await localStorage.writeFile(filepath, content, options);
      expect(fakeWriteFileFunc.mock.calls.length).toBe(1);
      const expectedFuncCall = fakeWriteFileFunc.mock.calls[0];
      expect(expectedFuncCall[0]).toBe(filepath);
      expect(expectedFuncCall[1]).toBe(content);
      expect(expectedFuncCall[2]).toBe(options);
      writeFileStub.restore();
    });

    it(`should return expected result`, async () => {
      const expectedContent = faker.lorem.paragraph(2);
      const filepath = path.join(testFilesDir, `test.txt`);
      const result = await localStorage.writeFile(filepath, expectedContent);

      expect(result.filepath).toBe(result.filepath);
      expect(result.ServerSideEncryption).toBeUndefined();
      expect(result.ETag).toBeUndefined();
      expect(result.$metadata).toBeUndefined();
      expect(result.ServerSideEncryption).toBeUndefined();
      expect(result.VersionId).toBeUndefined();
    });
  });

  describe(`deleteFile`, () => {
    it(`should delete the local file`, async () => {
      const filepath = createFile(`waiyanhein-greeting.txt`);
      expect(fs.existsSync(filepath)).toBeTruthy();
      await localStorage.deleteFile(filepath);
      expect(fs.existsSync(filepath)).toBeFalsy();
    });

    it(`should throw error when file does not exist`, async () => {
      let unlinkStub = sinon.stub(fs, 'unlink');
      let fakeUnlinkFunc = jest.fn((filepath, cb) => {
        cb(new Error(`File does not exist.`));
      });
      unlinkStub.callsFake(fakeUnlinkFunc);
      try {
        const filepath = path.join(testFilesDir, `waiy-greeting.txt`);
        await localStorage.deleteFile(filepath);
        throw new Error(`Expected error was not thrown.`);
      } catch (e) {
        if (!(e instanceof Error)) {
          throw new Error(`Expected error was not thrown.`);
        }
        expect(e.message).toBe(`File does not exist.`);
      }
      unlinkStub.restore();
    });
  });

  describe(`exists`, () => {
    it(`should return true if the file exist`, async () => {
      const filepath = createFile(`waiyanhein-greeting.txt`);

      expect(await localStorage.exists(filepath)).toBeTruthy();
      deleteFileIfExists(filepath);
    });

    it(`should return false if the file does not exist`, async () => {
      const filepath = path.join(testFilesDir, `waiyanhein-greeting.txt`);
      expect(await localStorage.exists(filepath)).toBeFalsy();
    });

    it(`should return true if the directory exists`, async () => {
      const dirpath = path.join(testFilesDir, `waiyanhein`);
      await fs.mkdirSync(dirpath);
      expect(await localStorage.exists(dirpath)).toBeTruthy();
    });

    it(`should return false if the directory does not exist`, async () => {
      const dirpath = path.join(testFilesDir, `doesnotexist`);
      expect(await localStorage.exists(dirpath)).toBeFalsy();
    });

    it(`should throw error when the error code is not ENOENT`, async () => {
      const fakeError = new FakeFileError(`Storage is full.`);
      fakeError.code = `STORAGE_FULL`;
      const statStub = sinon.stub(fs, `stat`);
      const fakeStatFunc = jest.fn((filepath, cb) => {
        cb(fakeError);
      });
      statStub.callsFake(fakeStatFunc);
      try {
        const filepath = path.join(testFilesDir, `fakefile.txt`);
        await localStorage.exists(filepath);
        throw new Error(`Expected error was not thrown.`);
      } catch (e) {
        expect(
          e instanceof FakeFileError && e.code === fakeError.code
        ).toBeTruthy();
      }
      statStub.restore();
    });
  });

  describe(`rename`, () => {
    it(`should rename file`, async () => {
      const filepath = createFile(`waiyanhein-greeting.txt`);
      const newFilepath = path.join(
        testFilesDir,
        `waiyanhein-greeting-new.txt`
      );
      await localStorage.rename(filepath, newFilepath);
      expect(fs.existsSync(newFilepath)).toBeTruthy();
      expect(fs.existsSync(filepath)).toBeFalsy();
      const content = fs.readFileSync(newFilepath, { encoding: 'utf-8' });
      expect(content).toBe(fakeFileContent);
    });

    it(`should rename directory`, async () => {
      const dirpath = path.join(testFilesDir, `waiyanhein`);
      await fs.mkdirSync(dirpath);
      const newDirpath = path.join(testFilesDir, `waiyanhein-new`);
      await localStorage.rename(dirpath, newDirpath);
      expect(fs.existsSync(newDirpath)).toBeTruthy();
    });

    it(`should throw error when file does not exist`, async () => {
      const fakeError = new FakeFileError(`File does not exist.`);
      fakeError.code = `FILE_NOT_FOUND`;
      const renameStub = sinon.stub(fs, `rename`);
      const fakeRenameFunc = jest.fn((from, to, cb) => {
        cb(fakeError);
      });
      renameStub.callsFake(fakeRenameFunc);
      try {
        const filepath = path.join(testFilesDir, `does-not-exist.txt`);
        await localStorage.rename(filepath, `newfile.txt`);
        throw new Error(`Expected error was not thrown`);
      } catch (e) {
        expect(
          e instanceof FakeFileError && e.code === fakeError.code
        ).toBeTruthy();
      }
      renameStub.restore();
    });
  });

  describe('copy', () => {
    it('should create a copy fil with the same content with the new filename', async () => {
      const from = 'test.txt';
      createFile(from);
      const absoluteFrom = path.join(testFilesDir, from);
      const absoluteTo = path.join(testFilesDir, 'to.txt');

      await localStorage.copy(absoluteFrom, absoluteTo);

      const content = fs.readFileSync(absoluteTo);

      expect(fs.existsSync(absoluteTo)).toBeTruthy();
      expect(content.toString()).toBe(fakeFileContent);
    });

    it('should not delete the source file after the copy is created', async () => {
      const from = 'from.txt';
      createFile(from);
      const absoluteFrom = path.join(testFilesDir, from);

      await localStorage.copy(absoluteFrom, path.join(testFilesDir, 'to.txt'));

      expect(fs.existsSync(absoluteFrom)).toBeTruthy();
    });

    it('should not invoke copyFile when source and destination filenames are the same', async () => {
      const copyFileSpy = sinon.spy(fs, 'copyFile');
      const from = 'from.txt';
      createFile(from);
      const absoluteFrom = path.join(testFilesDir, from);

      await localStorage.copy(absoluteFrom, absoluteFrom);

      sinon.assert.notCalled(copyFileSpy);
      copyFileSpy.restore();
    });

    it('should throw unexpected error when something went wrong with copying file', async () => {
      const copyFileStub = sinon
        .stub(fs, 'copyFile')
        .throws(new Error('Something went wrong!'));
      const from = 'from.txt';
      createFile(from);

      await expect(
        localStorage.copy(
          path.join(testFilesDir, from),
          path.join(testFilesDir, 'tox.txt')
        )
      ).rejects.toThrow('Something went wrong!');
      copyFileStub.restore();
    });
  });

  describe(`mkdir`, () => {
    it(`should create directory`, async () => {
      const dirPath = path.join(testFilesDir, `test-directory`);
      await localStorage.mkdir(dirPath);
      expect(fs.existsSync(dirPath)).toBeTruthy();
    });

    it(`should throw error`, async () => {
      const fakeFileError = new FakeFileError(`Insufficient permissions.`);
      fakeFileError.code = `INSUFFICIENT_PERMISSIONS`;
      const fsMkdirStub = sinon.stub(fs.promises, `mkdir`);
      const fakeMkdirFunc = jest.fn().mockImplementation((dirPath, options) => {
        return new Promise((resolve, reject) => {
          reject(fakeFileError);
        });
      });
      fsMkdirStub.callsFake(fakeMkdirFunc);
      try {
        const dirPath = path.join(testFilesDir, `test-directory`);
        await localStorage.mkdir(dirPath);
        throw new Error(`Expected error was not thrown`);
      } catch (e) {
        expect(
          e instanceof FakeFileError && e.code === fakeFileError.code
        ).toBeTruthy();
      }
      fsMkdirStub.restore();
    });
  });

  describe(`rmdir`, () => {
    it(`should delete directory`, async () => {
      const dirpath = createDirectoryIfNotExist(`wai`);
      expect(fs.existsSync(dirpath)).toBeTruthy();
      await localStorage.rmdir(dirpath);
      expect(fs.existsSync(dirpath)).toBeFalsy();
    });

    it(`should not delete directory and throw error instead by default when there is a file in it`, async () => {
      const dirpath = createDirectoryIfNotExist(`waiyan`);
      createFile(`waiyan/testfiletxt`);
      try {
        await localStorage.rmdir(dirpath);
        throw new Error(`Expected error was not thrown.`);
      } catch (e) {
        if (!e || typeof e !== 'object') {
          throw new Error(`Expected error was not thrown.`);
        }
        if (!('code' in e)) {
          throw new Error(`Expected error was not thrown.`);
        }
        expect(e.code).toBe(`ENOTEMPTY`);
      }
    });

    it(`should delete the directory with files in it when forceDelete flag is true`, async () => {
      const dirpath = createDirectoryIfNotExist(`waiyan`);
      const filepath = createFile(`waiyan/testfiletxt`);
      await localStorage.rmdir(dirpath, true);
      await delay(1000);

      expect(fs.existsSync(dirpath)).toBeFalsy();
      expect(fs.existsSync(filepath)).toBeFalsy();
    });
  });

  describe(`isDir`, () => {
    it(`should return true when the path is directory`, async () => {
      const dirpath = createDirectoryIfNotExist(`test`);
      expect(await localStorage.isDir(dirpath)).toBeTruthy();
    });

    it(`should return false when the path is file`, async () => {
      const filepath = createFile(`testing.txt`);
      expect(await localStorage.isDir(filepath)).toBeFalsy();
    });

    it(`should throw error when the file does not exist`, async () => {
      try {
        await localStorage.isDir(`i-do-not-exist`);
        throw new Error(`Expected error was not thrown.`);
      } catch (e) {
        if (!e || typeof e !== 'object' || !(`code` in e)) {
          throw new Error(`Expected error was not thrown.`);
        }
        expect(e.code).toBe(`ENOENT`);
      }
    });
  });

  describe(`isFile`, () => {
    it(`should return true when the path is file`, async () => {
      const filepath = createFile(`test.txt`);
      expect(await localStorage.isFile(filepath)).toBeTruthy();
    });

    it(`should return false when the path is directory`, async () => {
      const dir = createDirectoryIfNotExist(`testing`);
      expect(await localStorage.isFile(dir)).toBeFalsy();
    });

    it(`should throw error when the dir does not exist`, async () => {
      try {
        await localStorage.isFile(`i-do-not-exist.txt`);
        throw new Error(`Expected error was not thrown.`);
      } catch (e) {
        if (!e || typeof e !== 'object' || !(`code` in e)) {
          throw new Error(`Expected error was not thrown.`);
        }
        expect(e.code).toBe(`ENOENT`);
      }
    });
  });

  describe(`deleteFiles`, () => {
    it(`should delete the multiple files`, async () => {
      const file1Path = createFile(`file1.txt`);
      const file2Path = createFile(`file2.txt`);

      await localStorage.deleteFiles([ file1Path, file2Path ]);

      expect(fs.existsSync(file1Path)).toBeFalsy();
      expect(fs.existsSync(file2Path)).toBeFalsy();
    });

    it(`should not delete the files the other files`, async () => {
      const file1Path = createFile(`file1.txt`);
      const file2Path = createFile(`file2.txt`);

      await localStorage.deleteFiles([ file1Path ]);

      expect(fs.existsSync(file2Path)).toBeTruthy();
    });
  });

  const createFile = (filename: string): string => {
    const filepath = filename.startsWith(testFilesDir)
      ? filename
      : path.join(testFilesDir, filename);
    fs.writeFileSync(filepath, fakeFileContent);
    return filepath;
  };

  const createDirectoryIfNotExist = (dirname: string): string => {
    const dirpath = dirname.startsWith(testFilesDir)
      ? dirname
      : path.join(testFilesDir, dirname);
    if (!fs.existsSync(dirpath)) {
      fs.mkdirSync(dirpath);
    }

    return dirpath;
  };

  const deleteDirectoryIfExists = (dirpath: string) => {
    if (fs.existsSync(dirpath)) {
      fs.rmdirSync(dirpath, { recursive: true });
    }
  };

  const deleteFileIfExists = (filepath: string) => {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  };

  const readStream = async (readStream: fs.ReadStream): Promise<Buffer> => {
    return new Promise<Buffer>((resolve) => {
      let data: Buffer[] = [];
      readStream.on(`data`, (chunk) => {
        data.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      });
      readStream.on(`end`, () => {
        resolve(Buffer.concat(data));
      });
      readStream.on(`error`, (err) => {
        throw err;
      });
    });
  };
});
