import { faker } from '@faker-js/faker';
import {
  setEnvVariable,
  ValidationError
} from '@men-mvc/foundation';
import { generateUploadedFile } from '../../../src/test';
import {validateFile, validateImage, validateFileExtension} from "../../../src";

describe(`Validation Utilities`, () => {
  describe(`validateFile`, () => {
    it(`should pass validation when the input is empty`, () => {
      expect(validateFile(null, 'photo')).toBeUndefined();
    });

    it(`should pass validation for multiple files`, () => {
      expect(
        validateFile([generateUploadedFile(), generateUploadedFile()], 'photos')
      ).toBeUndefined();
    });

    it(`should pass validation for single file`, () => {
      expect(validateFile(generateUploadedFile(), 'photos')).toBeUndefined();
    });

    it(`should throw ValidationError when the input value is not file`, () => {
      try {
        validateFile(`I am not a file`, 'photo');
        throw new Error(`ValidationError was not thrown`);
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`ValidationError was not thrown`);
        }
        expect(e.errors['photo']).toBe(`Input value(s) must be file(s).`);
      }
    });

    it(`should throw ValidationError when the input value is array and any of the elements is not file`, () => {
      try {
        validateFile([generateUploadedFile(), `I am not a file`], 'photos');
        throw new Error(`ValidationError was not thrown`);
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`ValidationError was not thrown`);
        }
        expect(e.errors['photos']).toBe(`Input value(s) must be file(s).`);
      }
    });

    it(`should show the custom error message when the validation fails`, () => {
      try {
        validateFile(`I am not a file`, 'photo', `Please upload a photo.`);
        throw new Error(`ValidationError was not thrown`);
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`ValidationError was not thrown`);
        }
        expect(e.errors['photo']).toBe(`Please upload a photo.`);
      }
    });
  });

  describe(`validateImage`, () => {
    it(`should pass validation when input value is empty`, () => {
      expect(validateImage(null, 'photo')).toBeUndefined();
    });

    it(`should pass validation for an image file`, () => {
      expect(validateImage(generateUploadedFile(), 'photo')).toBeUndefined();
    });

    it(`should pass validation for multiple image files`, () => {
      expect(
        validateImage([generateUploadedFile(), generateUploadedFile()], 'photo')
      ).toBeUndefined();
    });

    it(`should pass validation when the image file's mime matches one of the additional values in env var`, () => {
      setEnvVariable(
        `UPLOADED_FILE_IMAGE_MIMES`,
        `image/svg+xml,application/svg+xml`
      );
      expect(
        validateImage(
          generateUploadedFile({
            filepath: `${faker.datatype.uuid()}.svg`,
            mimetype: `Image/Svg+Xml`
          }),
          'photo'
        )
      ).toBeUndefined();
      expect(
        validateImage(
          generateUploadedFile({
            filepath: `${faker.datatype.uuid()}.svg`,
            mimetype: `Application/Svg+Xml`
          }),
          'photo'
        )
      ).toBeUndefined();
      setEnvVariable(`UPLOADED_FILE_IMAGE_MIMES`, ``);
    });

    it(`should throw ValidationError when the input value is not file`, () => {
      try {
        validateImage(`I am not a file`, 'photo');
        throw new Error(`ValidationError was not thrown`);
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`ValidationError was not thrown`);
        }
        expect(e.errors['photo']).toBe(`Invalid image file(s).`);
      }
    });

    it(`should throw ValidationError when the input file is not image`, () => {
      try {
        validateImage(
          generateUploadedFile({
            originalFilename: `${faker.datatype.uuid()}.pdf`,
            mimetype: `document/pdf`
          }),
          'photo'
        );
        throw new Error(`ValidationError was not thrown`);
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`ValidationError was not thrown`);
        }
        expect(e.errors['photo']).toBe(`Invalid image file(s).`);
      }
    });

    it(`should throw ValidationError when the input value is array and any of the elements is not file`, () => {
      try {
        validateImage([generateUploadedFile(), `I am not a file`], 'photos');
        throw new Error(`ValidationError was not thrown`);
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`ValidationError was not thrown`);
        }
        expect(e.errors['photos']).toBe(`Invalid image file(s).`);
      }
    });

    it(`should throw ValidationError when any of the input files is not image`, () => {
      try {
        validateImage(
          [
            generateUploadedFile(),
            generateUploadedFile({
              originalFilename: `${faker.datatype.uuid()}.pdf`,
              mimetype: `document/pdf`
            })
          ],
          'photos'
        );
        throw new Error(`ValidationError was not thrown`);
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`ValidationError was not thrown`);
        }
        expect(e.errors['photos']).toBe(`Invalid image file(s).`);
      }
    });

    it(`should show the custom error message when the validation fails`, () => {
      try {
        validateImage(
          `I am not a file`,
          'photo',
          `Please upload an image file.`
        );
        throw new Error(`ValidationError was not thrown`);
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`ValidationError was not thrown`);
        }
        expect(e.errors['photo']).toBe(`Please upload an image file.`);
      }
    });
  });

  describe(`validateFileExtension`, () => {
    const allowedExtensions: string[] = [`.pdf`, `.PNG`, `.txt`];

    it(`should pass validation when input value is empty`, () => {
      expect(
        validateFileExtension(null, 'doc', allowedExtensions)
      ).toBeUndefined();
    });

    it(`should pass validation when file has valid extension`, () => {
      expect(
        validateFileExtension(generateUploadedFile(), 'doc', allowedExtensions)
      ).toBeUndefined();
    });

    it(`should pass validation when files has valid extension`, () => {
      expect(
        validateFileExtension(
          [
            generateUploadedFile(),
            generateUploadedFile({
              originalFilename: `${faker.datatype.uuid()}.TXT`,
              mimetype: `document/text`
            })
          ],
          'doc',
          allowedExtensions
        )
      ).toBeUndefined();
    });

    it(`should pass validation when allowedExtensions array is empty`, () => {
      expect(
        validateFileExtension(generateUploadedFile(), 'doc', [])
      ).toBeUndefined();
    });

    it(`should throw ValidationError when the input value is not file`, () => {
      try {
        validateFileExtension(`I am not a file`, 'photo', allowedExtensions);
        throw new Error(`ValidationError was not thrown`);
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`ValidationError was not thrown`);
        }
        expect(e.errors['photo']).toBe(
          `File does not have the valid extension.`
        );
      }
    });

    it(`should throw ValidationError when the input value is array and any of the elements is not file`, () => {
      try {
        validateFileExtension(
          [generateUploadedFile(), `I am not a file`],
          'photos',
          allowedExtensions
        );
        throw new Error(`ValidationError was not thrown`);
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`ValidationError was not thrown`);
        }
        expect(e.errors['photos']).toBe(
          `File does not have the valid extension.`
        );
      }
    });

    it(`should throw ValidationError when any of the input files does not have allowed extension`, () => {
      try {
        validateFileExtension(
          [
            generateUploadedFile(),
            generateUploadedFile({
              originalFilename: `${faker.datatype.uuid()}.bmp`,
              mimetype: `image/bmp`
            })
          ],
          'photos',
          allowedExtensions
        );
        throw new Error(`File does not have the valid extension.`);
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`ValidationError was not thrown`);
        }
        expect(e.errors['photos']).toBe(
          `File does not have the valid extension.`
        );
      }
    });

    it(`should show the custom error message when the validation fails`, () => {
      try {
        validateFileExtension(
          `I am not a file`,
          'photo',
          allowedExtensions,
          'File is invalid.'
        );
        throw new Error(`ValidationError was not thrown`);
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`ValidationError was not thrown`);
        }
        expect(e.errors['photo']).toBe(`File is invalid.`);
      }
    });
  });
});
