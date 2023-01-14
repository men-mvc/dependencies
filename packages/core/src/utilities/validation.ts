import {
  ObjectSchema,
  ValidationError as JoiValidationError,
  ValidationOptions
} from 'joi';
import { ValidationError } from '../types';
import { UploadedFile } from '../fileSystem';

export const resolveValidationError = (
  valError: JoiValidationError | undefined
): ValidationError => {
  if (!valError) {
    return new ValidationError([]);
  }

  return new ValidationError(
    valError.details.map((error) => ({
      [error.context?.key as string]: error.message
    }))
  );
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

export const failValidationForField = (field: string, errorMessage: string) => {
  throw new ValidationError([
    {
      [field]: errorMessage
    }
  ]);
};

// TODO: add validator for file extension

/**
 * This function can be used to validate both multiple-file upload and single upload
 */
export const validateFiles = <T>(value: T, field: string, message?: string) => {
  const error = message ?? `Input value(s) must be file(s).`;
  if (!value || !Array.isArray(value)) {
    failValidationForField(field, error);
  }
  const values = value as unknown[];
  for (let value of values) {
    if (!(value instanceof UploadedFile)) {
      failValidationForField(field, error);
    }
  }
};

/**
 * This function can be used to validate both multiple-file upload and single upload
 */
export const validateImageFiles = <T>(
  value: T,
  field: string,
  message?: string
) => {
  const error = message ?? `Invalid image file(s).`;
  if (!value || !Array.isArray(value)) {
    failValidationForField(field, error);
  }
  const values = value as unknown[];
  for (let value of values) {
    if (!(value instanceof UploadedFile)) {
      failValidationForField(field, error);
    }
    const file: UploadedFile = value as UploadedFile;
    if (!['image/gif', 'image/jpeg', 'image/png'].includes(file.mimetype)) {
      failValidationForField(field, error);
    }
  }
};