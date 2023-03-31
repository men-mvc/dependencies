import joi from 'joi';
import sinon, { SinonStub } from 'sinon';
import { Response } from 'express';
import { UploadedFile as ExpressUploadedFile } from 'express-fileupload';
import { UploadedFile, validateImage } from '@men-mvc/foundation';
import { faker } from '@faker-js/faker';
import {
  ValidateMultipartRequest,
  ValidateMultipartRequestAsync,
  MultipartRequest
} from '../../src';
import * as decorators from '../../src/decorators';

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

class MockController {
  // ! action method must be async
  @ValidateMultipartRequest(syncValSchema)
  public async validateFormRequestSync(
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
}

const controller = new MockController();

describe(`Decorators`, () => {
  let buildValidationErrorResponseStub: SinonStub;

  beforeEach(() => {
    buildValidationErrorResponseStub = sinon.stub(
      decorators,
      `buildValidationErrorResponse`
    );
  });

  afterEach(() => {
    if (buildValidationErrorResponseStub) {
      buildValidationErrorResponseStub.restore();
    }
  });

  describe(`ValidateMultipartRequest`, () => {
    it(`should fail validation when the input values are invalid`, async () => {
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

    it(`should parse the form data with uploaded file`, async () => {
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

      expect(result.photoFile?.originalFilename).toBe(
        mockRequestObject.files.photoFile.name
      );
      expect(result.photoFile?.filepath).toBe(
        mockRequestObject.files.photoFile.tempFilePath
      );
      expect(result.name).toBe(mockRequestObject.body.name);
    });
  });

  describe(`ValidateMultipartRequestAsync`, () => {
    /**
     * ! this test will execute this line - "} else if (e instanceof joi.ValidationError) {"
     */
    it(`should fail validation when input values are invalid without aborting the request immediately`, async () => {
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
     * ! this test will execute this line -> "if (e instanceof ValidationError)"
     */
    it(`should fail validation when input values are invalid aborting the request immediately`, async () => {
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

    it(`should parse the form data with uploaded file`, async () => {
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

      const result = await controller.validateFormRequestAsync(
        mockRequestObject as unknown as MultipartRequest<MultiForm>,
        {} as Response
      );

      expect(result.photoFile?.originalFilename).toBe(
        mockRequestObject.files.photoFile.name
      );
      expect(result.photoFile?.filepath).toBe(
        mockRequestObject.files.photoFile.tempFilePath
      );
      expect(result.name).toBe(mockRequestObject.body.name);
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
