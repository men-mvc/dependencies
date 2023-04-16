import sinon from 'sinon';
import Sinon, { SinonStub } from 'sinon';
import {
  DeepPartial,
  FileSystemDriver,
  setServerDirectory,
  UploadedFile
} from '@men-mvc/foundation';
import {
  FileArray,
  UploadedFile as ExpressUploadedFile
} from 'express-fileupload';
import { faker } from '@faker-js/faker';
import _ from 'lodash';
import path from 'path';
import fs from 'fs';
import { generateUploadedFile } from '@men-mvc/test';
import * as fileSystemUtilities from '../../src/utilities/utilities';
import { delay, deleteStorageDirectory } from '../testUtilities';
import {
  FileUploader,
  getPrivateStorageDirectory,
  getPublicStorageDirname,
  getStorageDirectory,
  getPrivateStorageDirname,
  getPublicStorageDirectory
} from '../../src';

const putCommandOutput = {
  $metadata: {
    httpStatusCode: 200,
    requestId: faker.datatype.uuid(),
    attempts: 2,
    totalRetryDelay: 2000
  },
  ETag: faker.datatype.uuid(),
  ServerSideEncryption: 'AES256',
  VersionId: faker.datatype.uuid()
};
const fakeUploadedFileContent = faker.lorem.sentence();
/**
 * Note: the remaining functions are tested as integration tests
 */
const fileUploader = new FileUploader();
describe('FileUploader Utility', function () {
  beforeAll(() => {
    setServerDirectory(process.cwd());
  });

  afterAll(() => {
    setServerDirectory('');
  });

  afterEach(() => {
    deleteStorageDirectory();
  });

  describe(`getLocalStorage`, () => {
    it(`should always return the same instance`, () => {
      expect(fileUploader.getLocalStorage()).toBe(
        fileUploader.getLocalStorage()
      );
    });
  });

  describe(`getS3Storage`, () => {
    it(`should always return the same instance`, () => {
      expect(fileUploader.getS3Storage()).toBe(fileUploader.getS3Storage());
    });
  });

  describe(`storeFile`, () => {
    let getDriverStub: SinonStub;
    let s3AdapterWriteFileStub: SinonStub;

    beforeEach(() => {
      s3AdapterWriteFileStub = sinon
        .stub(fileUploader.getS3Storage().getS3Adapter(), `writeFile`)
        .returns(Promise.resolve(putCommandOutput));
    });

    afterEach(async () => {
      if (getDriverStub) {
        getDriverStub.restore();
      }
      if (s3AdapterWriteFileStub) {
        s3AdapterWriteFileStub.restore();
      }
    });

    it(`should rename the uploaded file on the local storage`, async () => {
      getDriverStub = mockGetDriver(FileSystemDriver.local);
      const originalFilename = `testfile`;
      const uploadedFilepath = createTestUploadedFile(originalFilename);
      const uploadedFile = await generateUploadedFile({
        filepath: uploadedFilepath,
        originalFilename: `${originalFilename}.txt`
      });
      const storeFileParams = {
        uploadedFile,
        filename: `newFile`,
        directory: `testDirectory`
      };

      expect(fs.existsSync(uploadedFilepath)).toBeTruthy();

      await fileUploader.storeFile(storeFileParams);

      expect(
        fs.existsSync(
          `${path.join(
            getPrivateStorageDirectory(),
            storeFileParams.directory,
            storeFileParams.filename
          )}.txt`
        )
      ).toBeTruthy();
      expect(fs.existsSync(uploadedFilepath)).toBeFalsy();
    });

    it(`should allow both filename and directory to be undefined/ empty - local`, async () => {
      getDriverStub = mockGetDriver(FileSystemDriver.local);
      const originalFilename = `testfile`;
      const uploadedFilepath = createTestUploadedFile(originalFilename);
      const uploadedFile = await generateUploadedFile({
        filepath: uploadedFilepath,
        originalFilename: `${originalFilename}.txt`
      });
      const storeFileParams = {
        uploadedFile
      };
      const result = await fileUploader.storeFile(storeFileParams);

      expect(result.length).toBe(52);
      expect(
        fs.existsSync(path.join(getStorageDirectory(), result))
      ).toBeTruthy();
    });

    it(`should allow both filename and directory to be undefined - s3`, async () => {
      getDriverStub = mockGetDriver(FileSystemDriver.s3);
      const originalFilename = `testFile.txt`;
      const uploadedFilepath = createTestUploadedFile(`testFile`);
      const uploadedFile = await generateUploadedFile({
        filepath: uploadedFilepath,
        originalFilename
      });
      const storeFileParams = {
        uploadedFile
      };
      const createdObjectKey = await fileUploader.storeFile(storeFileParams);
      expect(createdObjectKey.length).toBe(52);
    });

    it(`should recursively create directory if the directory does not exist - local`, async () => {
      getDriverStub = mockGetDriver(FileSystemDriver.local);
      const originalFilename = `testfile`;
      const uploadedFilepath = createTestUploadedFile(originalFilename);
      const uploadedFile = await generateUploadedFile({
        filepath: uploadedFilepath,
        originalFilename: `${originalFilename}.txt`
      });
      const storeFileParams = {
        uploadedFile,
        directory: path.join(faker.datatype.uuid(), faker.datatype.uuid()),
        filename: faker.datatype.uuid()
      };
      await fileUploader.storeFile(storeFileParams);

      expect(
        fs.existsSync(
          path.join(
            getPrivateStorageDirectory(),
            storeFileParams.directory,
            `${storeFileParams.filename}.txt`
          )
        )
      ).toBeTruthy();
    });

    it(`should move the uploaded file on the local storage to the S3 bucket`, async () => {
      getDriverStub = mockGetDriver(FileSystemDriver.s3);
      const originalFilename = `testfile.txt`;
      const uploadedFilepath = createTestUploadedFile(`testfile`);
      const uploadedFile = await generateUploadedFile({
        filepath: uploadedFilepath,
        originalFilename
      });
      const fileKey = `testFileKey`;
      const directory = `testFileDirectory`;
      const storeFileParams = {
        uploadedFile,
        filename: fileKey,
        directory
      };
      const createdObjectKey = await fileUploader.storeFile(storeFileParams);

      expect(createdObjectKey).toBe(
        `${getPrivateStorageDirname()}/${directory}/${fileKey}.txt`
      );
      sinon.assert.calledOnceWithExactly(
        s3AdapterWriteFileStub,
        createdObjectKey,
        Buffer.from(fakeUploadedFileContent)
      );
    });

    it(`should delete the uploaded temp files after uploading file to S3`, async () => {
      getDriverStub = mockGetDriver(FileSystemDriver.s3);
      const originalFilename = `testfile.txt`;
      const uploadedFilepath = createTestUploadedFile(`testfile`);
      const uploadedFile = await generateUploadedFile({
        filepath: uploadedFilepath,
        originalFilename
      });
      await fileUploader.storeFile({
        uploadedFile,
        filename: `testFileKey`,
        directory: `testFileDirectory`
      });

      expect(fs.existsSync(uploadedFilepath)).toBeFalsy();
      expect(fs.existsSync(`${uploadedFilepath}.txt`)).toBeFalsy();
    });

    it(`should rename uploaded temp file adding file extension before uploading to S3`, async () => {
      const renameAsyncSpy = sinon.spy(fileSystemUtilities, `renameAsync`);
      getDriverStub = mockGetDriver(FileSystemDriver.s3);
      const originalFilename = `testfile.txt`;
      const uploadedFilepath = createTestUploadedFile(`testfile`);
      const uploadedFile = await generateUploadedFile({
        filepath: uploadedFilepath,
        originalFilename
      });
      await fileUploader.storeFile({
        uploadedFile,
        filename: `testFileKey`,
        directory: `testFileDirectory`
      });

      sinon.assert.calledOnceWithExactly(
        renameAsyncSpy,
        uploadedFile.filepath,
        `${uploadedFile.filepath}.txt`
      );
      renameAsyncSpy.restore();
    });

    it(`should return the path in storage of the uploaded file - local`, async () => {
      getDriverStub = mockGetDriver(FileSystemDriver.local);
      const originalFilename = `testfile`;
      const uploadedFilepath = createTestUploadedFile(originalFilename);
      const uploadedFile = await generateUploadedFile({
        filepath: uploadedFilepath,
        originalFilename: `${originalFilename}.txt`
      });
      const storeFileParams = {
        uploadedFile,
        directory: faker.datatype.uuid(),
        filename: faker.datatype.uuid()
      };
      const result = await fileUploader.storeFile(storeFileParams);
      expect(result).toBe(
        path.join(
          getPrivateStorageDirname(),
          storeFileParams.directory,
          `${storeFileParams.filename}.txt`
        )
      );
    });

    it(`should return the path in storage of the uploaded file - s3`, async () => {
      getDriverStub = mockGetDriver(FileSystemDriver.s3);
      const originalFilename = `testfile.txt`;
      const uploadedFilepath = createTestUploadedFile(`testfile`);
      const uploadedFile = await generateUploadedFile({
        filepath: uploadedFilepath,
        originalFilename
      });
      const params = {
        uploadedFile,
        filename: faker.datatype.uuid(),
        directory: faker.datatype.uuid()
      };
      const result = await fileUploader.storeFile(params);

      expect(result).toBe(
        path.join(
          getPrivateStorageDirname(),
          params.directory,
          `${params.filename}.txt`
        )
      );
    });

    const mockGetDriver = (driver: FileSystemDriver) =>
      Sinon.stub(fileSystemUtilities, `getDriver`).returns(driver);
  });

  describe(`storeFilePublicly`, () => {
    let getDriverStub: SinonStub;
    let s3AdapterWriteFileStub: SinonStub;

    beforeEach(() => {
      s3AdapterWriteFileStub = sinon
        .stub(fileUploader.getS3Storage().getS3Adapter(), `writeFile`)
        .returns(Promise.resolve(putCommandOutput));
    });

    afterEach(() => {
      getDriverStub.restore();
      s3AdapterWriteFileStub.restore();
    });

    describe(`s3`, () => {
      beforeEach(() => {
        getDriverStub = sinon
          .stub(fileSystemUtilities, `getDriver`)
          .returns(FileSystemDriver.s3);
      });

      it(`should move uploaded file on the local storage into the S3 bucket`, async () => {
        const filenameWithoutExt = faker.datatype.uuid();
        const uploadedFileAbsolutePath =
          createTestUploadedFile(filenameWithoutExt);
        const uploadedFile = generateUploadedFile({
          filepath: uploadedFileAbsolutePath,
          originalFilename: `${filenameWithoutExt}.txt`
        });
        const params = {
          uploadedFile,
          filename: `testFile`,
          directory: `testDirectory`
        };

        await fileUploader.storeFilePublicly(params);

        sinon.assert.calledOnceWithExactly(
          s3AdapterWriteFileStub,
          `${getPublicStorageDirname()}/${params.directory}/${
            params.filename
          }.txt`,
          Buffer.from(fakeUploadedFileContent)
        );
      });

      it(`should allow filename and directory params to be empty/ undefined`, async () => {
        const filenameWithoutExt = faker.datatype.uuid();
        const uploadedFileAbsolutePath =
          createTestUploadedFile(filenameWithoutExt);
        const uploadedFile = generateUploadedFile({
          filepath: uploadedFileAbsolutePath,
          originalFilename: `${filenameWithoutExt}.txt`
        });

        const result = await fileUploader.storeFilePublicly({
          uploadedFile
        });

        expect(result.length).toBe(51);
        expect(result.includes(getPublicStorageDirname())).toBeTruthy();
      });

      it(`should rename the uploaded temp file adding file extension before uploading to s3`, async () => {
        const renameAsyncSpy = sinon.spy(fileSystemUtilities, `renameAsync`);
        const filenameWithoutExt = faker.datatype.uuid();
        const uploadedFileAbsolutePath =
          createTestUploadedFile(filenameWithoutExt);
        const uploadedFile = generateUploadedFile({
          filepath: uploadedFileAbsolutePath,
          originalFilename: `${filenameWithoutExt}.txt`
        });

        await fileUploader.storeFilePublicly({
          uploadedFile
        });

        sinon.assert.calledOnceWithExactly(
          renameAsyncSpy,
          uploadedFileAbsolutePath,
          `${uploadedFileAbsolutePath}.txt`
        );
        renameAsyncSpy.restore();
      });

      it(`should delete the uploaded temp files after uploading the file to s3`, async () => {
        const filenameWithoutExt = faker.datatype.uuid();
        const uploadedFileAbsolutePath =
          createTestUploadedFile(filenameWithoutExt);
        const uploadedFile = generateUploadedFile({
          filepath: uploadedFileAbsolutePath,
          originalFilename: `${filenameWithoutExt}.txt`
        });

        expect(fs.existsSync(uploadedFileAbsolutePath)).toBeTruthy();

        await fileUploader.storeFilePublicly({
          uploadedFile
        });

        expect(fs.existsSync(uploadedFileAbsolutePath)).toBeFalsy();
        expect(fs.existsSync(`${uploadedFileAbsolutePath}.txt`)).toBeFalsy();
      });

      it(`should return path in the storage`, async () => {
        const filenameWithoutExt = faker.datatype.uuid();
        const uploadedFileAbsolutePath =
          createTestUploadedFile(filenameWithoutExt);
        const uploadedFile = generateUploadedFile({
          filepath: uploadedFileAbsolutePath,
          originalFilename: `${filenameWithoutExt}.txt`
        });

        const params = {
          uploadedFile,
          filename: faker.datatype.uuid(),
          directory: faker.datatype.uuid()
        };

        const result = await fileUploader.storeFilePublicly(params);

        expect(result).toBe(
          `${getPublicStorageDirname()}/${params.directory}/${
            params.filename
          }.txt`
        );
      });
    });

    describe(`local`, () => {
      beforeEach(() => {
        getDriverStub = sinon
          .stub(fileSystemUtilities, `getDriver`)
          .returns(FileSystemDriver.local);
      });

      it(`should rename the uploaded file`, async () => {
        const filenameWithoutExt = faker.datatype.uuid();
        const uploadedFileAbsolutePath =
          createTestUploadedFile(filenameWithoutExt);
        const uploadedFile = generateUploadedFile({
          filepath: uploadedFileAbsolutePath,
          originalFilename: `${filenameWithoutExt}.txt`
        });
        const targetFilename = `testFile`;
        const targetDirname = `testDirectory`;

        expect(fs.existsSync(uploadedFileAbsolutePath)).toBeTruthy();

        await fileUploader.storeFilePublicly({
          filename: targetFilename,
          directory: targetDirname,
          uploadedFile
        });

        expect(fs.existsSync(uploadedFileAbsolutePath)).toBeFalsy();
        expect(
          fs.existsSync(
            path.join(
              getPublicStorageDirectory(),
              targetDirname,
              `${targetFilename}.txt`
            )
          )
        ).toBeTruthy();
      });

      it(`should allow both filename and director parameters to be empty/ undefined`, async () => {
        const filenameWithoutExt = faker.datatype.uuid();
        const uploadedFileAbsolutePath =
          createTestUploadedFile(filenameWithoutExt);
        const uploadedFile = generateUploadedFile({
          filepath: uploadedFileAbsolutePath,
          originalFilename: `${filenameWithoutExt}.txt`
        });

        const result = await fileUploader.storeFilePublicly({
          uploadedFile
        });

        expect(
          fs.existsSync(path.join(getStorageDirectory(), result))
        ).toBeTruthy();
      });

      it(`should recursively create directory if the directory does not exist`, async () => {
        const filenameWithoutExt = faker.datatype.uuid();
        const uploadedFileAbsolutePath =
          createTestUploadedFile(filenameWithoutExt);
        const uploadedFile = generateUploadedFile({
          filepath: uploadedFileAbsolutePath,
          originalFilename: `${filenameWithoutExt}.txt`
        });

        const targetDir = path.join(
          faker.datatype.uuid(),
          faker.datatype.uuid()
        );
        const targetFilename = faker.datatype.uuid();

        const result = await fileUploader.storeFilePublicly({
          uploadedFile,
          filename: targetFilename,
          directory: targetDir
        });

        expect(result).toBe(
          path.join(
            getPublicStorageDirname(),
            targetDir,
            `${targetFilename}.txt`
          )
        );
        expect(
          fs.existsSync(path.join(getStorageDirectory(), result))
        ).toBeTruthy();
      });

      it(`should return the path in storage of the created file`, async () => {
        const filenameWithoutExt = faker.datatype.uuid();
        const uploadedFileAbsolutePath =
          createTestUploadedFile(filenameWithoutExt);
        const uploadedFile = generateUploadedFile({
          filepath: uploadedFileAbsolutePath,
          originalFilename: `${filenameWithoutExt}.txt`
        });

        const targetDir = faker.datatype.uuid();
        const targetFilename = faker.datatype.uuid();

        const result = await fileUploader.storeFilePublicly({
          uploadedFile,
          filename: targetFilename,
          directory: targetDir
        });

        expect(result).toBe(
          path.join(
            getPublicStorageDirname(),
            targetDir,
            `${targetFilename}.txt`
          )
        );
      });
    });
  });

  describe(`_makeUploadedFileCompatible`, () => {
    it(`should convert original uploaded file to the format that is compatible with the app`, () => {
      const originalFile: ExpressUploadedFile = generateExpressUploadedFile();
      const result = fileUploader._makeUploadedFileCompatible(originalFile);
      expect(result instanceof UploadedFile).toBeTruthy();
      expect(result.originalFilename).toBe(originalFile.name);
      expect(result.size).toBe(originalFile.size);
      expect(result.mimetype).toBe(originalFile.mimetype);
      expect(result.hash).toBe(originalFile.md5);
      expect(result.filepath).toBe(originalFile.tempFilePath);
    });
  });

  describe(`_getTotalUploadedFileSize`, () => {
    it(`should return 0 when files parameter is null`, () => {
      expect(fileUploader._getTotalUploadedFileSize(null)).toBe(0);
    });

    it(`should return 0 when files parameter is undefined`, () => {
      expect(fileUploader._getTotalUploadedFileSize(undefined)).toBe(0);
    });

    it(`should return the sum of the size of all files`, () => {
      const files: FileArray = {
        photo: generateExpressUploadedFile({
          size: 4
        }),
        gallery: [
          generateExpressUploadedFile({
            size: 10
          }),
          generateExpressUploadedFile({
            size: 9
          }),
          generateExpressUploadedFile({
            size: 4
          })
        ]
      };
      expect(fileUploader._getTotalUploadedFileSize(files)).toBe(27);
    });
  });

  describe(`_isPayloadTooLarge`, () => {
    const fakeUploadFilesizeLimit = 10;
    let getUploadFilesizeLimitStub: sinon.SinonStub;
    beforeAll(() => {
      getUploadFilesizeLimitStub = sinon.stub(
        fileSystemUtilities,
        `getUploadFilesizeLimit`
      );
      getUploadFilesizeLimitStub.returns(fakeUploadFilesizeLimit);
    });
    afterAll(() => {
      getUploadFilesizeLimitStub.restore();
    });

    it(`should return true when total size of uploaded files is greater than limit`, () => {
      const files: FileArray = {
        photo: generateExpressUploadedFile({
          size: 4
        }),
        gallery: [
          generateExpressUploadedFile({
            size: 4
          }),
          generateExpressUploadedFile({
            size: 3
          })
        ]
      };
      expect(fileUploader._isPayloadTooLarge(files)).toBeTruthy();
    });

    it(`should return false when total size of uploaded files is equal to limit`, () => {
      const files: FileArray = {
        gallery: [
          generateExpressUploadedFile({
            size: 5
          }),
          generateExpressUploadedFile({
            size: 5
          })
        ]
      };
      expect(fileUploader._isPayloadTooLarge(files)).toBeFalsy();
    });

    it(`should return false when total size of uploaded files is less than limit`, () => {
      const files: FileArray = {
        gallery: [
          generateExpressUploadedFile({
            size: 5
          }),
          generateExpressUploadedFile({
            size: 4
          })
        ]
      };
      expect(fileUploader._isPayloadTooLarge(files)).toBeFalsy();
    });
  });

  describe(`_getTempDirId`, () => {
    it(`should always return the same temp dir id`, async () => {
      expect(fileUploader._getTempDirId()).toBe(fileUploader._getTempDirId());
    });
  });

  describe(`getAbsoluteTempUploadDirPath`, () => {
    it(`should return expected temp storage absolute dir path`, () => {
      const fakeUuid = faker.datatype.uuid();
      const getTempDirIdStub = sinon.stub(fileUploader, `_getTempDirId`);
      getTempDirIdStub.returns(fakeUuid);
      const expectedDirPath = path.join(
        path.join(getStorageDirectory(), 'temp'),
        fakeUuid
      );
      const actualDirPath = fileUploader.getAbsoluteTempUploadDirPath();
      expect(actualDirPath).toBe(expectedDirPath);
      getTempDirIdStub.restore();
    });
  });

  describe(`clearTempUploadDirectory`, () => {
    it(`should delete the temp dir and its content for the same session`, async () => {
      const tempDir = await createTempDirAndContents();
      await fileUploader.clearTempUploadDirectory();
      await delay();
      expect(fs.existsSync(tempDir)).toBeFalsy();
    });

    it(`should not delete the temp dirs for the other sessions`, async () => {
      const tempDir = await createTempDirAndContents();
      const otherTempDirs = await createTempDirsForOtherSessions();
      await fileUploader.clearTempUploadDirectory();
      await delay();
      expect(fs.existsSync(tempDir)).toBeFalsy();
      expect(otherTempDirs.length > 0).toBeTruthy();
      otherTempDirs.map((otherTempDir) => {
        expect(fs.existsSync(otherTempDir)).toBeTruthy();
        expect(
          fs.existsSync(path.join(otherTempDir, `tempfile.txt`))
        ).toBeTruthy();
      });
    });

    it(`should fail silently when clearing temp storage directory throws error`, async () => {
      const getLocalStorageStub = sinon
        .stub(fileUploader, `getLocalStorage`)
        .throws(`Something went wrong.`);
      await fileUploader.clearTempUploadDirectory();

      expect(getLocalStorageStub.threw()).toBeTruthy();
      getLocalStorageStub.restore();
    });

    it(`should reset temp dir id after clearing the temp directory`, async () => {
      await createTempDirAndContents();
      const tempDirBefore = fileUploader._getTempDirId();
      await fileUploader.clearTempUploadDirectory();
      await delay();
      expect(tempDirBefore).not.toBe(fileUploader._getTempDirId());
    });

    const createTempDirAndContents = async (): Promise<string> => {
      const tempDir = fileUploader.getAbsoluteTempUploadDirPath();
      await fs.promises.mkdir(tempDir, { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, `tempfile1.txt`),
        faker.lorem.paragraphs(3)
      );
      fs.writeFileSync(
        path.join(tempDir, `tempfile2.txt`),
        faker.lorem.paragraphs(4)
      );
      return tempDir;
    };

    const createTempDirsForOtherSessions = async (): Promise<string[]> => {
      const tempDirs: string[] = [
        path.join(getPrivateStorageDirectory(), 'temp', faker.datatype.uuid()),
        path.join(getPrivateStorageDirectory(), 'temp', faker.datatype.uuid())
      ];
      await Promise.all(
        tempDirs.map((dir) =>
          Promise.all([fs.promises.mkdir(dir, { recursive: true })])
        )
      );
      await Promise.all(
        tempDirs.map((dir) => {
          return new Promise<string>((resolve) => {
            const filepath = path.join(dir, `tempfile.txt`);
            fs.writeFileSync(filepath, faker.lorem.paragraphs(3));
            resolve(filepath);
          });
        })
      );

      return tempDirs;
    };
  });

  const generateExpressUploadedFile = (
    data: DeepPartial<ExpressUploadedFile> = {}
  ): ExpressUploadedFile => {
    const defaultData: ExpressUploadedFile = {
      name: `${faker.lorem.word()}.png`,
      mimetype: `image/png`,
      size: faker.datatype.number(5),
      md5: faker.datatype.uuid(),
      encoding: `utf-8`,
      data: Buffer.from(`testing`),
      truncated: faker.datatype.boolean(),
      tempFilePath: `/storage/${faker.datatype.uuid()}.png`,
      mv: (path): Promise<void> => {
        return Promise.resolve();
      }
    };

    return _.merge(defaultData, data);
  };

  /**
   * ! uploaded files are stored in temp directory
   */
  const createTestUploadedFile = (filename: string): string => {
    const testTempFileDir = path.join(getStorageDirectory(), `temp`);
    if (!fs.existsSync(testTempFileDir)) {
      fs.mkdirSync(testTempFileDir, {
        recursive: true
      });
    }

    const absoluteFilepath = path.join(testTempFileDir, filename);
    fs.writeFileSync(absoluteFilepath, fakeUploadedFileContent);

    return absoluteFilepath;
  };
});
