import {
  UploadedFile as ExpressUploadedFile,
  FileArray
} from 'express-fileupload';
import { faker } from '@faker-js/faker';
import _ from 'lodash';
import { FileUploader } from '../../../src/fileSystem/fileUploader';
import { UploadedFile, DeepPartial } from '../../../src';

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
