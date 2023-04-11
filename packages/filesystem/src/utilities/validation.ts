import path from 'path';
import {
  failValidationForField,
  getEnvVariable,
  UploadedFile
} from '@men-mvc/foundation';

const isUploadedFile = (value: unknown): value is UploadedFile =>
  value instanceof UploadedFile;

const isImageFile = (file: UploadedFile): boolean => {
  let imageMimeTypes: string[] = ['image/gif', 'image/jpeg', 'image/png'];
  const additionalImageMimesCsv: string = getEnvVariable(
    'UPLOADED_FILE_IMAGE_MIMES',
    ''
  ) as string;
  if (additionalImageMimesCsv) {
    const additionalMimes = additionalImageMimesCsv
      .split(',')
      .map((mime) => mime.toLowerCase());
    imageMimeTypes = imageMimeTypes.concat(additionalMimes);
  }

  return imageMimeTypes.includes(file.mimetype.toLowerCase());
};

const validateImageFile = (field: string, value: unknown, error: string) => {
  if (!isUploadedFile(value)) {
    // input value is not a file
    return failValidationForField(field, error);
  }
  if (!isImageFile(value)) {
    failValidationForField(field, error);
  }
};

/**
 * This function can be used to validate both multiple-file upload and single upload
 */
export const validateFile = <T>(
  value: T | null,
  field: string,
  message?: string
): void => {
  const error = message ?? `Input value(s) must be file(s).`;
  if (!value) {
    // if the value is empty, it does not validate if the input is file or not
    return;
  }
  if (Array.isArray(value)) {
    const values = value as unknown[];
    for (let element of values) {
      if (!isUploadedFile(element)) {
        failValidationForField(field, error);
      }
    }
  } else if (!isUploadedFile(value)) {
    // single file upload
    failValidationForField(field, error);
  }
};

/**
 * This function can be used to validate both multiple-file upload and single upload
 */
export const validateImage = <T>(
  value: T | null,
  field: string,
  message?: string
) => {
  const error = message ?? `Invalid image file(s).`;
  if (!value) {
    // when the input field is empty, it will pass.
    return;
  }
  if (Array.isArray(value)) {
    // multiple files
    value.map((file) => validateImageFile(field, file, error));
  } else {
    validateImageFile(field, value, error);
  }
};

/**
 * This function can be used to validate both multiple-file upload and single upload
 */
export const validateFileExtension = (
  value: unknown,
  field: string,
  allowedExtensions: string[], // including .
  message?: string
) => {
  if (!value) {
    return;
  }
  if (allowedExtensions.length < 1) {
    return;
  }
  const error = message ?? `File does not have the valid extension.`;
  const validate = (singleVal: unknown): boolean => {
    if (!isUploadedFile(singleVal)) {
      return false;
    }
    return allowedExtensions.some(
      (ext) =>
        ext.toLowerCase() ===
        path.extname(singleVal.originalFilename).toLowerCase()
    );
  };
  if (Array.isArray(value)) {
    for (let file of value) {
      if (!validate(file)) {
        failValidationForField(field, error);
      }
    }
  } else if (!validate(value)) {
    failValidationForField(field, error);
  }
};
