import joi from 'joi';
import { Response } from 'express';
import {
  resolveValidationError,
  validateRequest,
  validateRequestAsync,
  ValidationError,
  validationErrorResponse
} from '@men-mvc/foundation';
import { MultipartRequest } from './types';
import { FileSystem } from './fileSystem';

// ! to make the logic mockable
export const buildValidationErrorResponse = (
  res: Response,
  validationError: ValidationError
) => {
  return validationErrorResponse(res, validationError);
};

export const ValidateMultipartRequestAsync = (schema: joi.ObjectSchema) => {
  return function (
    scope: unknown,
    methodName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      req: MultipartRequest<Record<string, unknown>>,
      res: Response,
      ...args: unknown[]
    ) {
      try {
        req.parsedFormData = await FileSystem.getInstance().parseFormData(req);
        await validateRequestAsync(schema, req.parsedFormData);
      } catch (e) {
        if (e instanceof ValidationError) {
          return buildValidationErrorResponse(res, e);
        } else if (e instanceof joi.ValidationError) {
          return buildValidationErrorResponse(res, resolveValidationError(e));
        }
      }

      return originalMethod.apply(this, [req, res, ...args]);
    };
  };
};

export const ValidateMultipartRequest = (schema: joi.ObjectSchema) => {
  return (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      req: MultipartRequest<Record<string, unknown>>,
      res: Response,
      ...args: unknown[]
    ) {
      try {
        req.parsedFormData = await FileSystem.getInstance().parseFormData(req);
        validateRequest(schema, req.body);
      } catch (e: unknown) {
        if (e instanceof ValidationError) {
          return buildValidationErrorResponse(res, e);
        }
      }

      return originalMethod.apply(this, [req, res, ...args]);
    };

    return descriptor;
  };
};
