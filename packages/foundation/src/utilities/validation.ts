import { Request, Response, NextFunction } from 'express';
import { ExternalHelpers } from 'joi';
import path from 'path';
import joi, {
  ObjectSchema,
  ValidationError as JoiValidationError,
  ValidationOptions
} from 'joi';
import { getEnvVariable } from '@men-mvc/config';
import {
  ValidationError,
  UploadedFile,
  isRequestValidator,
  RequestValidator
} from '../types';
import { validationErrorResponse } from './response';
import { invokeRequestErrorHandler } from './error';

export const getValidatedFieldName = (options: ExternalHelpers): string => {
  if (Array.isArray(options.state.path)) {
    return options.state.path.join('.');
  } else if (typeof options.state.path === 'string') {
    return options.state.path;
  } else {
    return ``;
  }
};

export const resolveValidationError = (
  valError: JoiValidationError | undefined
): ValidationError => {
  if (!valError) {
    return new ValidationError({});
  }

  let errors: Record<string, string> = {};
  valError.details.map((error) => {
    errors[error.path.join('.')] = error.message;
  });
  return new ValidationError(errors);
};

export const validateRequest = <T>(
  schema: ObjectSchema,
  data: T,
  options: ValidationOptions = {
    abortEarly: false
  }
) => {
  const valResult = schema.validate(data, options);
  if (valResult.error) {
    throw resolveValidationError(valResult.error);
  }
};

export const validateRequestAsync = async <T>(
  schema: ObjectSchema,
  data: T,
  options: ValidationOptions = {
    abortEarly: false
  }
) => {
  /**
   * Joi will throw built-in ValidationError for async validation
   */
  await schema.validateAsync(data, options);
};

export const failValidationForField = (
  field: string,
  errorMessage: string
): never => {
  throw new ValidationError({
    [field]: errorMessage
  });
};

export function ValidateRequest(
  schemaOrValidator: joi.ObjectSchema | RequestValidator
) {
  return (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (
      req: Request,
      res: Response,
      next?: NextFunction
    ) {
      try {
        validateRequest(
          isRequestValidator(schemaOrValidator)
            ? schemaOrValidator.getSchema(req, res)
            : schemaOrValidator,
          req.body
        );
      } catch (e: unknown) {
        if (e instanceof ValidationError) {
          return validationErrorResponse(res, e);
        }

        return invokeRequestErrorHandler(e as Error, req, res);
      }

      return originalMethod.apply(this, [req, res, next]);
    };

    return descriptor;
  };
}

export const ValidateRequestAsync = (
  schemaOrValidator: joi.ObjectSchema | RequestValidator
) => {
  return function (
    scope: unknown,
    methodName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      req: Request,
      res: Response,
      ...args: unknown[]
    ) {
      try {
        await validateRequestAsync(
          isRequestValidator(schemaOrValidator)
            ? schemaOrValidator.getSchema(req, res)
            : schemaOrValidator,
          req.body
        );
      } catch (e) {
        if (e instanceof ValidationError) {
          return validationErrorResponse(res, e);
        } else if (e instanceof joi.ValidationError) {
          return validationErrorResponse(res, resolveValidationError(e));
        }

        return invokeRequestErrorHandler(e as Error, req, res);
      }

      return originalMethod.apply(this, [req, res, ...args]);
    };
  };
};
