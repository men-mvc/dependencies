import sinon from 'sinon';
import {
  UploadedFile as ExpressUploadedFile,
  FileArray
} from 'express-fileupload';
import { faker } from '@faker-js/faker';
import _ from 'lodash';
import path from 'path';
import fs from 'fs';
import { DeepPartial, UploadedFile } from '@men-mvc/globals';
import * as fileSystemUtilities from '../../src/utilities';
import { delay, deleteStorageDirectory } from '../testUtilities';
import {FileUploader, getAppStorageDirectory} from "../../src";

const fileUploader = new FileUploader();
describe('FileUploader Utility', function () {
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

  describe(`getTempUploadDirectory`, () => {
    it(`should return expected temp storage dir path`, () => {
      const fakeUuid = faker.datatype.uuid();
      const getTempDirIdStub = sinon.stub(fileUploader, `_getTempDirId`);
      getTempDirIdStub.returns(fakeUuid);
      const expectedDirPath = path.join(
        path.join(getAppStorageDirectory(), 'temp'),
        fakeUuid
      );
      const actualDirPath = fileUploader.getTempUploadDirectory();
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
      deleteStorageDirectory();
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
      deleteStorageDirectory();
    });

    it(`should fail silently when clearing temp storage directory throws error`, async () => {
      const getLocalStorageStub = sinon.stub(fileUploader, `getLocalStorage`).throws(`Something went wrong.`);
      await fileUploader.clearTempUploadDirectory();

      expect(getLocalStorageStub.threw()).toBeTruthy();
      getLocalStorageStub.restore();
    });

    const createTempDirAndContents = async (): Promise<string> => {
      const tempDir = fileUploader.getTempUploadDirectory();
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
        path.join(getAppStorageDirectory(), 'temp', faker.datatype.uuid()),
        path.join(getAppStorageDirectory(), 'temp', faker.datatype.uuid())
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
});
