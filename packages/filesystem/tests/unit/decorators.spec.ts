import joi from 'joi';
import sinon, { SinonStub } from 'sinon';
import { Request, Response } from 'express';
import { UploadedFile as ExpressUploadedFile } from 'express-fileupload';
import { RequestValidator, UploadedFile } from '@men-mvc/foundation';
import { faker } from '@faker-js/faker';
import {
  ValidateMultipartRequest,
  ValidateMultipartRequestAsync,
  MultipartRequest,
  ParseFormData
} from '../../src';
import * as decorators from '../../src/decorators';
import * as utilities from '../../src/utilities/utilities';
import { validateImage, FileSystem } from '../../src';
import { invokeAppRequestErrorHandler } from '../../lib';

type MultiForm = {
  name: string;
  photoFile?: UploadedFile;
};

const syncValSchema = joi.object().keys({
  name: joi.string().required(),
  photoFile: joi.any().optional()
});

const asyncValSchema = joi.object().keys({
  name: joi.string().required(),
  photoFile: joi
    .any()
    .required()
    .external(async (value) => {
      validateImage(value, 'photoFile', 'Photo file must be an image file.');
    })
});

class SyncRequestValidator implements RequestValidator {
  getSchema(req: Request): joi.ObjectSchema {
    if (req.header('test') !== 'valid') {
      throw new Error(`Unable to retrieve data from the header.`);
    }

    return syncValSchema;
  }
}

class AsyncRequestValidator implements RequestValidator {
  getSchema(req: Request): joi.ObjectSchema {
    if (req.header('test') !== 'valid') {
      throw new Error(`Unable to retrieve data from the header.`);
    }

    return asyncValSchema;
  }
}

class MockController {
  // ! action method must be async
  @ValidateMultipartRequest(syncValSchema)
  public async validateFormRequestSync(
    req: MultipartRequest<MultiForm>,
    res: Response
  ) {
    return req.parsedFormData;
  }

  @ValidateMultipartRequest(new SyncRequestValidator())
  public async validateFormRequestSyncUsingValidatorClass(
    req: MultipartRequest<MultiForm>,
    res: Response
  ) {
    return req.parsedFormData;
  }

  @ValidateMultipartRequestAsync(asyncValSchema)
  public async validateFormRequestAsync(
    req: MultipartRequest<MultiForm>,
    res: Response
  ) {
    return req.parsedFormData;
  }

  @ValidateMultipartRequestAsync(new AsyncRequestValidator())
  public async validateFormRequestAsyncUsingValidatorClass(
    req: MultipartRequest<MultiForm>,
    res: Response
  ) {
    return req.parsedFormData;
  }

  @ParseFormData()
  public async parseFormData(req: MultipartRequest<MultiForm>, res: Response) {
    return req.parsedFormData;
  }
}

const controller = new MockController();

describe(`Decorators`, () => {
  let buildValidationErrorResponseStub: SinonStub;
  let invokeRequestErrorHandlerStub: SinonStub;

  beforeEach(() => {
    invokeRequestErrorHandlerStub = sinon.stub(
      utilities,
      'invokeAppRequestErrorHandler'
    );
    buildValidationErrorResponseStub = sinon.stub(
      decorators,
      `buildValidationErrorResponse`
    );
  });

  afterEach(() => {
    FileSystem.resetInstance();
    if (buildValidationErrorResponseStub) {
      buildValidationErrorResponseStub.restore();
    }
    invokeRequestErrorHandlerStub.restore();
  });

  describe(`ValidateMultipartRequest`, () => {
    it(`should fail validation when the input values are invalid - using schema`, async () => {
      const mockRequestObject = {
        files: {},
        body: {
          name: null
        }
      };

      const result = await controller.validateFormRequestSync(
        mockRequestObject as unknown as MultipartRequest<MultiForm>,
        {} as Response
      );

      expect(result).toBeUndefined();
      sinon.assert.calledOnce(buildValidationErrorResponseStub);
      expect(
        buildValidationErrorResponseStub.getCalls()[0].args[0]
      ).toBeTruthy();
    });

    it(`should fail validation when the input values are invalid - using request validator class`, async () => {
      const mockRequestObject = {
        header: (field: string) => 'valid',
        files: {},
        body: {
          name: null
        }
      };

      const result =
        await controller.validateFormRequestSyncUsingValidatorClass(
          mockRequestObject as unknown as MultipartRequest<MultiForm>,
          {} as Response
        );

      expect(result).toBeUndefined();
      sinon.assert.calledOnce(buildValidationErrorResponseStub);
      expect(
        buildValidationErrorResponseStub.getCalls()[0].args[0]
      ).toBeTruthy();
    });

    it(`should parse the form data with uploaded file - using schema`, async () => {
      const mockRequestObject = {
        files: {
          photoFile: generateExpressUploadedFile()
        },
        body: {
          name: faker.name.fullName()
        }
      };

      const result = await controller.validateFormRequestSync(
        mockRequestObject as unknown as MultipartRequest<MultiForm>,
        {} as Response
      );

      assertFormParsed(result as MultiForm, {
        photoFile: mockRequestObject.files.photoFile,
        name: mockRequestObject.body.name
      });
    });

    it(`should parse the form data with uploaded file - using request validator class`, async () => {
      const mockRequestObject = {
        header: (field: string) => `valid`,
        files: {
          photoFile: generateExpressUploadedFile()
        },
        body: {
          name: faker.name.fullName()
        }
      };

      const result =
        await controller.validateFormRequestSyncUsingValidatorClass(
          mockRequestObject as unknown as MultipartRequest<MultiForm>,
          {} as Response
        );

      assertFormParsed(result as MultiForm, {
        photoFile: mockRequestObject.files.photoFile,
        name: mockRequestObject.body.name
      });
    });

    it(`should not return error response when the validation passes - using schema`, async () => {
      const mockRequestObject = {
        files: {
          photoFile: generateExpressUploadedFile()
        },
        body: {
          name: faker.name.fullName()
        }
      };

      await controller.validateFormRequestSync(
        mockRequestObject as unknown as MultipartRequest<MultiForm>,
        {} as Response
      );

      sinon.assert.notCalled(buildValidationErrorResponseStub);
      sinon.assert.notCalled(invokeRequestErrorHandlerStub);
    });

    it(`should not return error response when the validation passes - using request validator class`, async () => {
      const mockRequestObject = {
        header: (field: string) => `valid`,
        files: {
          photoFile: generateExpressUploadedFile()
        },
        body: {
          name: faker.name.fullName()
        }
      };

      await controller.validateFormRequestSyncUsingValidatorClass(
        mockRequestObject as unknown as MultipartRequest<MultiForm>,
        {} as Response
      );

      sinon.assert.notCalled(buildValidationErrorResponseStub);
      sinon.assert.notCalled(invokeRequestErrorHandlerStub);
    });

    // ! this test also make sure that request validator class can interact with the request object
    it(`should invoke app request error handler when the error is not validation error`, async () => {
      const mockRequestObject = {
        header: (field: string) => `invalid`,
        files: {
          photoFile: generateExpressUploadedFile()
        },
        body: {
          name: faker.name.fullName()
        }
      };

      await controller.validateFormRequestSyncUsingValidatorClass(
        mockRequestObject as unknown as MultipartRequest<MultiForm>,
        {
          statusCode: 422
        } as Response
      );

      sinon.assert.calledOnce(invokeRequestErrorHandlerStub);
      const callArgs = invokeRequestErrorHandlerStub.getCalls()[0].args;
      expect((callArgs[0] as Error).message).toBe(
        `Unable to retrieve data from the header.`
      );
      expect((callArgs[1] as Request).body.name).toBe(
        mockRequestObject.body.name
      );
      expect((callArgs[2] as Response).statusCode).toBe(422);
    });

    const assertFormParsed = (
      actualForm: MultiForm,
      expected: {
        photoFile: ExpressUploadedFile;
        name: string;
      }
    ) => {
      expect(actualForm.photoFile?.originalFilename).toBe(
        expected.photoFile.name
      );
      expect(actualForm.photoFile?.filepath).toBe(
        expected.photoFile.tempFilePath
      );
      expect(actualForm.name).toBe(expected.name);
    };
  });

  describe(`ValidateMultipartRequestAsync`, () => {
    /**
     * ! this test will execute this line - "} else if (e instanceof joi.ValidationError) {"
     */
    it(`should fail validation when input values are invalid without aborting the request immediately - using schema`, async () => {
      const mockRequestObject = {
        files: {},
        body: {
          name: faker.name.fullName()
        }
      };

      const result = await controller.validateFormRequestAsync(
        mockRequestObject as unknown as MultipartRequest<MultiForm>,
        {} as Response
      );

      expect(result).toBeUndefined();
      sinon.assert.calledOnce(buildValidationErrorResponseStub);
      expect(
        buildValidationErrorResponseStub.getCalls()[0].args[0]
      ).toBeTruthy();
    });

    /**
     * ! this test will execute this line - "} else if (e instanceof joi.ValidationError) {"
     */
    it(`should fail validation when input values are invalid without aborting the request immediately - using request validator class`, async () => {
      const mockRequestObject = {
        header: (field: string) => `valid`,
        files: {},
        body: {
          name: faker.name.fullName()
        }
      };

      const result =
        await controller.validateFormRequestAsyncUsingValidatorClass(
          mockRequestObject as unknown as MultipartRequest<MultiForm>,
          {} as Response
        );

      expect(result).toBeUndefined();
      sinon.assert.calledOnce(buildValidationErrorResponseStub);
      expect(
        buildValidationErrorResponseStub.getCalls()[0].args[0]
      ).toBeTruthy();
    });

    /**
     * ! this test will execute this line -> "if (e instanceof ValidationError)"
     */
    it(`should fail validation when input values are invalid aborting the request immediately - using schema`, async () => {
      const mockRequestObject = {
        files: {
          photoFile: generateExpressUploadedFile({
            mimetype: `document/pdf` // this will make image file validation fail and abort the request immediately
          })
        },
        body: {
          name: faker.name.fullName()
        }
      };

      const result = await controller.validateFormRequestAsync(
        mockRequestObject as unknown as MultipartRequest<MultiForm>,
        {} as Response
      );

      expect(result).toBeUndefined();
      sinon.assert.calledOnce(buildValidationErrorResponseStub);
      expect(
        buildValidationErrorResponseStub.getCalls()[0].args[0]
      ).toBeTruthy();
    });

    /**
     * ! this test will execute this line -> "if (e instanceof ValidationError)"
     */
    it(`should fail validation when input values are invalid aborting the request immediately - using request validator class`, async () => {
      const mockRequestObject = {
        header: (field: string) => `valid`,
        files: {
          photoFile: generateExpressUploadedFile({
            mimetype: `document/pdf` // this will make image file validation fail and abort the request immediately
          })
        },
        body: {
          name: faker.name.fullName()
        }
      };

      const result =
        await controller.validateFormRequestAsyncUsingValidatorClass(
          mockRequestObject as unknown as MultipartRequest<MultiForm>,
          {} as Response
        );

      expect(result).toBeUndefined();
      sinon.assert.calledOnce(buildValidationErrorResponseStub);
      expect(
        buildValidationErrorResponseStub.getCalls()[0].args[0]
      ).toBeTruthy();
    });

    it(`should parse the form data with uploaded file - using schema`, async () => {
      const mockRequestObject = {
        files: {
          photoFile: generateExpressUploadedFile({
            mimetype: `image/jpeg`
          })
        },
        body: {
          name: faker.name.fullName()
        }
      };

      const result = (await controller.validateFormRequestAsync(
        mockRequestObject as unknown as MultipartRequest<MultiForm>,
        {} as Response
      )) as MultiForm;

      expect(result.photoFile?.originalFilename).toBe(
        mockRequestObject.files.photoFile.name
      );
      expect(result.photoFile?.filepath).toBe(
        mockRequestObject.files.photoFile.tempFilePath
      );
      expect(result.name).toBe(mockRequestObject.body.name);
    });

    it(`should parse the form data with uploaded file - using request validator class`, async () => {
      const mockRequestObject = {
        header: (field: string) => `valid`,
        files: {
          photoFile: generateExpressUploadedFile({
            mimetype: `image/jpeg`
          })
        },
        body: {
          name: faker.name.fullName()
        }
      };

      const result =
        (await controller.validateFormRequestAsyncUsingValidatorClass(
          mockRequestObject as unknown as MultipartRequest<MultiForm>,
          {} as Response
        )) as MultiForm;

      expect(result.photoFile?.originalFilename).toBe(
        mockRequestObject.files.photoFile.name
      );
      expect(result.photoFile?.filepath).toBe(
        mockRequestObject.files.photoFile.tempFilePath
      );
      expect(result.name).toBe(mockRequestObject.body.name);
    });

    it(`should not return error response when the validation passes - using schema`, async () => {
      const mockRequestObject = {
        files: {
          photoFile: generateExpressUploadedFile({
            mimetype: `image/jpeg`
          })
        },
        body: {
          name: faker.name.fullName()
        }
      };

      await controller.validateFormRequestAsync(
        mockRequestObject as unknown as MultipartRequest<MultiForm>,
        {} as Response
      );

      sinon.assert.notCalled(buildValidationErrorResponseStub);
      sinon.assert.notCalled(invokeRequestErrorHandlerStub);
    });

    it(`should not return error response when the validation passes - using request validator class`, async () => {
      const mockRequestObject = {
        header: (field: string) => `valid`,
        files: {
          photoFile: generateExpressUploadedFile({
            mimetype: `image/jpeg`
          })
        },
        body: {
          name: faker.name.fullName()
        }
      };

      await controller.validateFormRequestAsyncUsingValidatorClass(
        mockRequestObject as unknown as MultipartRequest<MultiForm>,
        {} as Response
      );

      sinon.assert.notCalled(buildValidationErrorResponseStub);
      sinon.assert.notCalled(invokeRequestErrorHandlerStub);
    });

    // ! this test also ensure that request validator class can interact with request object
    it(`should invoke app request error handler when the error is not validation error`, async () => {
      const mockRequestObject = {
        header: (field: string) => `invalid`,
        files: {
          photoFile: generateExpressUploadedFile({
            mimetype: `image/jpeg`
          })
        },
        body: {
          name: faker.name.fullName()
        }
      };

      await controller.validateFormRequestAsyncUsingValidatorClass(
        mockRequestObject as unknown as MultipartRequest<MultiForm>,
        {
          statusCode: 422
        } as Response
      );

      sinon.assert.calledOnce(invokeRequestErrorHandlerStub);
      const callArgs = invokeRequestErrorHandlerStub.getCalls()[0].args;
      expect((callArgs[0] as Error).message).toBe(
        `Unable to retrieve data from the header.`
      );
      expect((callArgs[1] as Request).body.name).toBe(
        mockRequestObject.body.name
      );
      expect((callArgs[2] as Response).statusCode).toBe(422);
    });
  });

  describe(`parseFormData`, () => {
    it(`should parse the form data with uploaded file`, async () => {
      const mockRequestObject = {
        files: {
          photoFile: generateExpressUploadedFile()
        },
        body: {
          name: faker.name.fullName()
        }
      };

      const result = await controller.parseFormData(
        mockRequestObject as unknown as MultipartRequest<MultiForm>,
        {} as Response
      );

      expect(result).not.toBeUndefined();
      if (!result) {
        return;
      }
      expect(result.photoFile?.originalFilename).toBe(
        mockRequestObject.files.photoFile.name
      );
      expect(result.photoFile?.filepath).toBe(
        mockRequestObject.files.photoFile.tempFilePath
      );
      expect(result.name).toBe(mockRequestObject.body.name);
    });

    it(`should set field field to undefined when the field is not present in the form data`, async () => {
      const mockRequestObject = {
        files: {},
        body: {
          name: faker.name.fullName()
        }
      };

      const result = await controller.parseFormData(
        mockRequestObject as unknown as MultipartRequest<MultiForm>,
        {} as Response
      );
      expect(result).not.toBeUndefined();
      if (!result) {
        return;
      }
      expect(result.name).toBe(mockRequestObject.body.name);
      expect(result.photoFile).toBeUndefined();
    });

    it(`should invoke app request error handle when there is an error parsing the form data`, async () => {
      FileSystem.resetInstance();
      const parseFormDataStub = sinon
        .stub(FileSystem.getInstance(), 'parseFormData')
        .throws(new Error('Unable to parse form data.'));
      const mockRequestObject = {
        files: {},
        body: {
          name: faker.name.fullName()
        }
      };

      const result = await controller.parseFormData(
        mockRequestObject as unknown as MultipartRequest<MultiForm>,
        {} as Response
      );

      expect(result).toBeUndefined();
      sinon.assert.calledOnce(invokeRequestErrorHandlerStub);
      const callArgs = invokeRequestErrorHandlerStub.getCalls()[0].args;
      expect((callArgs[0] as Error).message).toBe(`Unable to parse form data.`);
      parseFormDataStub.restore();
    });
  });

  const generateExpressUploadedFile = (
    data: Partial<ExpressUploadedFile> = {}
  ): ExpressUploadedFile => {
    const defaultData: ExpressUploadedFile = {
      name: faker.datatype.uuid(),
      mv: async (path: string) => {},
      encoding: 'utf-8',
      mimetype: faker.system.mimeType(),
      data: Buffer.from(faker.datatype.uuid()),
      tempFilePath: faker.system.filePath(),
      truncated: false,
      size: faker.datatype.number(),
      md5: faker.datatype.uuid()
    };

    return {
      ...defaultData,
      ...data
    };
  };
});
