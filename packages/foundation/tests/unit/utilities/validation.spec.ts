import { Request, Response } from 'express';
import { ExternalHelpers } from 'joi';
import sinon, { SinonStub, stub } from 'sinon';
import joi from 'joi';
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
  validationErrorResponse,
  getValidatedFieldName
} from '../../../src';
import * as responseUtilities from '../../../src/utilities/response';
import * as errorUtilities from '../../../src/utilities/error';
import { delay, generateUploadedFile } from '../../../testUtilities';
import { MockValidationController } from './mocks/mockValidationController';

describe(`Validation Utility`, () => {
  describe(`getValidatedFieldName`, () => {
    it(`should return empty string when options.state.path is undefined`, () => {
      expect(
        getValidatedFieldName({
          state: {
            path: undefined
          }
        } as ExternalHelpers)
      ).toBe(``);
    });

    it(`should return options.state.path string`, () => {
      expect(
        getValidatedFieldName({
          state: {
            path: `test_field`
          }
        } as ExternalHelpers)
      ).toBe(`test_field`);
    });

    it(`should return string joining segments of options.state.path array with dot`, () => {
      expect(
        getValidatedFieldName({
          state: {
            path: [`seg1`, `seg2`, `seg3`]
          }
        } as unknown as ExternalHelpers)
      ).toBe(`seg1.seg2.seg3`);
    });
  });

  describe(`resolveValidationError`, () => {
    it(`should resolve schema errors`, () => {
      const contactSchema = joi.object().keys({
        email: joi.string().required(),
        phone: joi.string().required()
      });

      const userSchema = joi.object().keys({
        name: joi.string().required(),
        contacts: joi.array().items(contactSchema).required()
      });
      const joiResult = userSchema.validate(
        {
          name: ``,
          contacts: [
            {
              email: ``,
              phone: ``
            }
          ]
        },
        {
          abortEarly: false
        }
      );
      const error = resolveValidationError(joiResult.error);
      expect(error instanceof ValidationError).toBeTruthy();
      expect(Object.keys(error.errors).length).toBe(3);
      expect(error.errors['name']).toBe('"name" is not allowed to be empty');
      expect(error.errors['contacts.0.email']).toBe(
        '"contacts[0].email" is not allowed to be empty'
      );
      expect(error.errors['contacts.0.phone']).toBe(
        '"contacts[0].phone" is not allowed to be empty'
      );
    });

    it(`should separate error of a nested field has the same name as one of the parent fields`, async () => {
      const contactSchema = joi.object().keys({
        name: joi.string().required(),
        phone: joi.string().required()
      });

      const userSchema = joi.object().keys({
        name: joi.string().required(),
        phone: joi.string().required(),
        emergencyContacts: joi.array().items(contactSchema).required(),
        spouse: contactSchema
      });

      const joiValidationResult = userSchema.validate(
        {
          name: ``,
          phone: ``,
          emergencyContacts: [
            {
              name: ``,
              phone: ``
            },
            {
              name: ``,
              phone: ``
            }
          ],
          spouse: {
            name: ``,
            phone: ``
          }
        },
        { abortEarly: false }
      );

      const resolvedError = resolveValidationError(joiValidationResult.error);
      expect(resolvedError instanceof ValidationError).toBeTruthy();
      expect(Object.keys(resolvedError.errors).length).toBe(8);
      expect(resolvedError.errors['name']).toBe(
        '"name" is not allowed to be empty'
      );
      expect(resolvedError.errors['phone']).toBe(
        '"phone" is not allowed to be empty'
      );
      expect(resolvedError.errors['emergencyContacts.0.name']).toBe(
        '"emergencyContacts[0].name" is not allowed to be empty'
      );
      expect(resolvedError.errors['emergencyContacts.0.phone']).toBe(
        '"emergencyContacts[0].phone" is not allowed to be empty'
      );
      expect(resolvedError.errors['emergencyContacts.1.name']).toBe(
        '"emergencyContacts[1].name" is not allowed to be empty'
      );
      expect(resolvedError.errors['emergencyContacts.1.phone']).toBe(
        '"emergencyContacts[1].phone" is not allowed to be empty'
      );
      expect(resolvedError.errors['spouse.name']).toBe(
        '"spouse.name" is not allowed to be empty'
      );
      expect(resolvedError.errors['spouse.phone']).toBe(
        '"spouse.phone" is not allowed to be empty'
      );
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
    let invokeRequestErrorHandlerStub: SinonStub;
    const mockController = new MockValidationController();

    beforeAll(() => {
      validationErrorResponseStub = stubValidationErrorResponse();
    });

    afterAll(() => {
      validationErrorResponseStub.restore();
    });

    beforeEach(() => {
      invokeRequestErrorHandlerStub = sinon.stub(
        errorUtilities,
        'invokeRequestErrorHandler'
      );
    });

    afterEach(() => {
      validationErrorResponseStub.reset();
      if (invokeRequestErrorHandlerStub) {
        invokeRequestErrorHandlerStub.restore();
      }
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
        sinon.assert.notCalled(invokeRequestErrorHandlerStub);
        expect(response).toBeTruthy();
      });

      it(`should return validation error response - using RequestValidator class`, async () => {
        const mockController = new MockValidationController();
        mockController.validateRequestWithValidatorClass(
          {
            header: (field: string): string => `valid`,
            body: {
              name: ''
            }
          } as Request,
          {} as Response
        );

        sinon.assert.calledOnce(validationErrorResponseStub);
      });

      it(`should not return validation error response - using RequestValidator class`, async () => {
        const response = mockController.validateRequestWithValidatorClass(
          {
            header: (field: string): string => `valid`,
            body: {
              name: 'I am not empty'
            }
          } as Request,
          {} as Response
        );

        sinon.assert.notCalled(validationErrorResponseStub);
        sinon.assert.notCalled(invokeRequestErrorHandlerStub);
        expect(response).toBeTruthy();
      });

      // ! this test also ensure that request validator class can do something with request object
      it(`should invoke app request handler function when the error is not validation error`, async () => {
        mockController.validateRequestWithValidatorClass(
          {
            header: (field: string): string => `invalid`,
            body: {
              name: 'I am not empty'
            }
          } as Request,
          {
            statusCode: 422
          } as Response
        );

        sinon.assert.calledOnce(invokeRequestErrorHandlerStub);
        const callArgs = invokeRequestErrorHandlerStub.getCalls()[0].args;
        expect(callArgs[0] instanceof Error).toBeTruthy();
        expect((callArgs[0] as Error).message).toBe(
          `Unable to retrieve data from request.`
        );
        expect((callArgs[1] as Request).body.name).toBe('I am not empty');
        expect((callArgs[2] as Response).statusCode).toBe(422);
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
        sinon.assert.notCalled(invokeRequestErrorHandlerStub);
      });

      it(`should pass validation - using Request Validator class`, async () => {
        mockController.validateRequestAsyncWithValidatorClass(
          {
            header: (field: string): string => `valid`,
            body: {
              code: 'TEST',
              codeConfirmation: 'TEST'
            }
          } as Request,
          {} as Response
        );
        await delay(1000); // async

        sinon.assert.notCalled(validationErrorResponseStub);
        sinon.assert.notCalled(invokeRequestErrorHandlerStub);
      });

      it(`should return validation error response - using Request Validator class`, async () => {
        mockController.validateRequestAsyncWithValidatorClass(
          {
            header: (field: string): string => `valid`,
            body: {
              code: 'TEST',
              codeConfirmation: 'TES!!'
            }
          } as Request,
          {} as Response
        );
        await delay(1000); // async

        sinon.assert.calledOnce(validationErrorResponseStub);
      });

      // ! this test also ensure that request validator class can do something with request object
      it(`should invoke app request error handler when error is not validation error`, async () => {
        mockController.validateRequestAsyncWithValidatorClass(
          {
            header: (field: string): string => `invalid`,
            body: {
              code: 'TEST',
              codeConfirmation: 'TEST'
            }
          } as Request,
          {
            statusCode: 422
          } as Response
        );
        await delay(1000); // async

        sinon.assert.calledOnce(invokeRequestErrorHandlerStub);
        const callArgs = invokeRequestErrorHandlerStub.getCalls()[0].args;
        expect(callArgs[0] instanceof Error).toBeTruthy();
        expect((callArgs[0] as Error).message).toBe(
          `Unable to retrieve the data from the request.`
        );
        expect((callArgs[1] as Request).body.code).toBe(`TEST`);
        expect((callArgs[2] as Response).statusCode).toBe(422);
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
