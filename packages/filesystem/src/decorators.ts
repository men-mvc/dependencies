import joi from 'joi';
import { Response } from 'express';
import {
  isRequestValidator,
  RequestValidator,
  resolveValidationError,
  validateRequest,
  validateRequestAsync,
  ValidationError,
  validationErrorResponse
} from '@men-mvc/foundation';
import { MultipartRequest } from './types';
import { FileSystem } from './fileSystem';
import { invokeAppRequestErrorHandler } from './utilities/utilities';

// ! to make the logic mockable
export const buildValidationErrorResponse = (
  res: Response,
  validationError: ValidationError
) => {
  return validationErrorResponse(res, validationError);
};

export const ValidateMultipartRequestAsync = (
  schemaOrValidator: joi.ObjectSchema | RequestValidator
) => {
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
        await validateRequestAsync(
          isRequestValidator(schemaOrValidator)
            ? schemaOrValidator.getSchema(req, res)
            : schemaOrValidator,
          req.parsedFormData
        );
      } catch (e) {
        if (e instanceof ValidationError) {
          return buildValidationErrorResponse(res, e);
        } else if (e instanceof joi.ValidationError) {
          return buildValidationErrorResponse(res, resolveValidationError(e));
        }

        return invokeAppRequestErrorHandler(e as Error, req, res);
      }

      return originalMethod.apply(this, [req, res, ...args]);
    };
  };
};

export const ValidateMultipartRequest = (
  schemaOrValidator: joi.ObjectSchema | RequestValidator
) => {
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
        validateRequest(
          isRequestValidator(schemaOrValidator)
            ? schemaOrValidator.getSchema(req, res)
            : schemaOrValidator,
          req.body
        );
      } catch (e: unknown) {
        if (e instanceof ValidationError) {
          return buildValidationErrorResponse(res, e);
        }

        return invokeAppRequestErrorHandler(e as Error, req, res);
      }

      return originalMethod.apply(this, [req, res, ...args]);
    };

    return descriptor;
  };
};

export const ParseFormData = () => {
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
      } catch (e: unknown) {
        return invokeAppRequestErrorHandler(e as Error, req, res);
      }

      return originalMethod.apply(this, [req, res, ...args]);
    };

    return descriptor;
  };
};
