import { Request, Response } from 'express';
import sinon, { SinonStub, stub } from 'sinon';
import joi, {
  ValidationError as JoiValidationError,
  ValidationErrorItem
} from 'joi';
import { faker } from '@faker-js/faker';
import { setEnvVariable } from '@men-mvc/config';
import {
  resolveValidationError,
  ValidationError,
  validateRequest,
  failValidationForField,
  validateRequestAsync,
  validateFile,
  validateImage,
  validateFileExtension,
  ValidateRequest,
  ValidateRequestAsync,
  validationErrorResponse
} from '../../../src';
import * as responseUtilities from '../../../src/utilities/response';
import { delay, generateUploadedFile } from '../../../testUtilities';
import { MockValidationController } from './mocks/mockValidationController';

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

  describe(`Validation decorators`, () => {
    let validationErrorResponseStub: SinonStub;
    const mockController = new MockValidationController();

    beforeAll(() => {
      validationErrorResponseStub = stubValidationErrorResponse();
    });

    afterEach(() => {
      validationErrorResponseStub.reset();
    });

    afterAll(() => {
      validationErrorResponseStub.restore();
    });

    describe(`ValidateRequest`, () => {
      it(`should return validation error response when the validation fails`, () => {
        const mockController = new MockValidationController();
        mockController.validateRequest(
          {
            body: {
              name: ''
            }
          } as Request,
          {} as Response
        );

        sinon.assert.calledOnce(validationErrorResponseStub);
      });

      it(`should not return validation error response when the validation passes`, () => {
        const response = mockController.validateRequest(
          {
            body: {
              name: 'I am not empty'
            }
          } as Request,
          {} as Response
        );

        sinon.assert.notCalled(validationErrorResponseStub);
        expect(response).toBeTruthy();
      });
    });

    describe(`ValidateRequestAsync`, () => {
      it(`should return validation error response when the validation fails and throws app validation error`, async () => {
        mockController.validateRequestAsync(
          {
            body: {
              code: 'INVALID_CODE'
            }
          } as Request,
          {} as Response
        );
        await delay(1000); // async

        sinon.assert.calledOnce(validationErrorResponseStub);
      });

      it(`should return validation error response when the validation fails and throw joi validation error`, async () => {
        mockController.validateRequestAsync(
          {
            body: {
              code: ''
            }
          } as Request,
          {} as Response
        );
        await delay(1000); // async

        sinon.assert.calledOnce(validationErrorResponseStub);
      });

      it(`should not return the validation error response when the validation passes`, async () => {
        mockController.validateRequestAsync(
          {
            body: {
              code: 'TEST'
            }
          } as Request,
          {} as Response
        );
        await delay(1000); // async

        sinon.assert.notCalled(validationErrorResponseStub);
      });
    });

    const stubValidationErrorResponse = (): SinonStub => {
      const subjectFuncStub = stub(
        responseUtilities,
        'validationErrorResponse'
      );
      return subjectFuncStub.callsFake(jest.fn());
    };
  });
});
