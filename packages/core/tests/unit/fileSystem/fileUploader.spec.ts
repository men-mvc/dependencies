import { UploadedFile as OriginalUploadedFile } from 'express-fileupload';
import { faker } from '@faker-js/faker';
import { FileUploader } from '../../../src/fileSystem/fileUploader';
import { UploadedFile } from '../../../src';

describe('FileUploader Utility', function () {
  describe(`_makeUploadedFileCompatible`, () => {
    it(`should convert original uploaded file to the format that is compatible with the app`, () => {
      const originalFile: OriginalUploadedFile = {
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
      const fileUploader = new FileUploader();
      const result = fileUploader._makeUploadedFileCompatible(originalFile);
      expect(result instanceof UploadedFile).toBeTruthy();
      expect(result.originalFilename).toBe(originalFile.name);
      expect(result.size).toBe(originalFile.size);
      expect(result.mimetype).toBe(originalFile.mimetype);
      expect(result.hash).toBe(originalFile.md5);
      expect(result.filepath).toBe(originalFile.tempFilePath);
    });
  });
});
