import { Request, Response } from 'express';
import joi from 'joi';
import {
  failValidationForField,
  RequestValidator,
  ValidateRequest,
  ValidateRequestAsync
} from '../../../../src';

const validateRequestSchema = joi.object({
  name: joi.string().required()
});

class SyncRequestValidator implements RequestValidator {
  getSchema(req: Request): joi.ObjectSchema {
    if (req.header('test') !== 'valid') {
      throw new Error(`Unable to retrieve data from request.`);
    }

    return validateRequestSchema;
  }
}

const validateCodePromise = async (code: string) => {
  return new Promise((resolve) => {
    if (code === 'TEST') {
      resolve(true);
    } else {
      resolve(false);
    }
  });
};

const validateRequestAsyncSchema = joi.object({
  code: joi
    .string()
    .required()
    .external(async (value) => {
      const result = await validateCodePromise(value);
      if (!result) {
        failValidationForField('code', 'Invalid code.');
      }
    })
});

class AsyncRequestValidator implements RequestValidator {
  getSchema(req: Request): joi.ObjectSchema {
    if (req.header('test') !== 'valid') {
      throw new Error(`Unable to retrieve the data from the request.`);
    }

    return joi.object().keys({
      code: joi.string().required(),
      codeConfirmation: joi
        .string()
        .required()
        .external(async (value) => {
          if (value !== req.body.code) {
            failValidationForField(
              `codeConfirmation`,
              `Please confirm the code correctly.`
            );
          }
        })
    });
  }
}

export class MockValidationController {
  @ValidateRequest(validateRequestSchema)
  public validateRequest(req: Request, res: Response) {
    return true;
  }

  @ValidateRequest(new SyncRequestValidator())
  public validateRequestWithValidatorClass(req: Request, res: Response) {
    return true;
  }

  @ValidateRequestAsync(validateRequestAsyncSchema)
  public validateRequestAsync(req: Request, res: Response) {
    return true;
  }

  @ValidateRequestAsync(new AsyncRequestValidator())
  public validateRequestAsyncWithValidatorClass(req: Request, res: Response) {
    return true;
  }
}
