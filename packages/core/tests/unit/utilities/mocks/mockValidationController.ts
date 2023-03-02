import { Request, Response } from 'express';
import joi from 'joi';
import {
  failValidationForField,
  ValidateRequest,
  ValidateRequestAsync
} from '../../../../src';

const validateRequestSchema = joi.object({
  name: joi.string().required()
});

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

export class MockValidationController {
  @ValidateRequest(validateRequestSchema)
  public validateRequest(req: Request, res: Response) {
    return true;
  }

  @ValidateRequestAsync(validateRequestAsyncSchema)
  public validateRequestAsync(req: Request, res: Response) {
    return true;
  }
}
