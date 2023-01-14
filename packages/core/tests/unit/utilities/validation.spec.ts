import joi, {
  ValidationError as JoiValidationError,
  ValidationErrorItem
} from 'joi';
import { faker } from '@faker-js/faker';
import {
  resolveValidationError,
  ValidationError,
  validateRequest,
  failValidationForField,
  validateRequestAsync,
  validateFile,
  UploadedFile,
  validateImage
} from '../../../src';
import { DeepPartial } from '../../../lib';

describe(`Validation Utility`, () => {
  describe(`resolveValidationError`, () => {
    it(`should convert joi validation error into app-compatible format and return ValidationError`, () => {
      const errors: ValidationErrorItem[] = [
        createFakeValidationErrorItem(`name`, `Name is required.`),
        createFakeValidationErrorItem(`email`, `Email is required.`)
      ];
      const result = resolveValidationError(
        new JoiValidationError(`ValidationError`, errors, null)
      );
      expect(result instanceof ValidationError).toBeTruthy();
      expect(Object.keys(result.errors).length).toBe(2);
      Object.keys(result.errors).map((key, index) => {
        expect(result.errors[key]).toBe(errors[index].message);
        expect(key).toBe(errors[index].context?.key);
      });
    });

    const createFakeValidationErrorItem = (
      key: string,
      message: string
    ): ValidationErrorItem => ({
      message,
      path: [],
      type: `any`,
      context: {
        key
      }
    });
  });

  describe(`validateRequest`, () => {
    it(`should throw ValidationError when validation fails`, () => {
      try {
        const schema = createFakeValidationSchema();
        validateRequest(schema, { name: `` });
        throw new Error(`Expected error was not thrown`);
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`Error is not instance of ValidationError.`);
        }
        expect(e.errors['name']).toBe(`Name is required.`);
      }
    });

    it(`should not throw error when validation fails`, () => {
      const schema = createFakeValidationSchema();
      const result = validateRequest(schema, { name: faker.name.fullName() });
      expect(result).toBeUndefined();
    });

    const createFakeValidationSchema = (): joi.ObjectSchema =>
      joi.object().keys({
        name: joi.string().required().messages({
          'string.empty': `Name is required.`
        })
      });
  });

  describe(`validateRequestAsync`, () => {
    it(`should throw ValidationError when validation fails`, async () => {
      try {
        const schema = createFakeValidationSchema();
        await validateRequestAsync(schema, { email: faker.internet.email() });
        throw new Error(`ValidationError was not thrown.`);
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`ValidationError was not thrown.`);
        }
        expect(e.errors[`email`]).toBe(`Account does not exist.`);
      }
    });

    it(`should not throw error when the validation passes`, async () => {
      const schema = createFakeValidationSchema();
      const result = await validateRequestAsync(schema, {
        email: `waiyanhein@test.com`
      });
      expect(result).toBeUndefined();
    });

    const createFakeValidationSchema = (): joi.ObjectSchema =>
      joi.object().keys({
        email: joi
          .string()
          .required()
          .external(async (value) => {
            const result = await ((): Promise<boolean> => {
              return new Promise<boolean>((resolve) =>
                resolve(value === `waiyanhein@test.com`)
              );
            })();
            if (!result) {
              failValidationForField('email', 'Account does not exist.');
            }
          })
      });
  });

  describe(`failValidationForField`, () => {
    it(`should throw ValidationError with expected errors`, () => {
      try {
        failValidationForField(`email`, `Email is required.`);
        throw new Error(`ValidationError was not thrown.`);
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`ValidationError was not thrown.`);
        }
        expect(e.errors['email']).toBe(`Email is required.`);
      }
    });
  });

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

  const generateUploadedFile = (
    data: DeepPartial<UploadedFile> = {}
  ): UploadedFile => {
    const defaultData: UploadedFile = {
      filepath: faker.datatype.uuid(),
      size: faker.datatype.number(2),
      originalFilename: `${faker.datatype.uuid()}.png`,
      mimetype: `image/png`
    };

    return new UploadedFile({ ...defaultData, ...data });
  };
});
