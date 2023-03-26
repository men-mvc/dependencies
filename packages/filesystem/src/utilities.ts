import { Response } from 'express';
import { baseConfig, FileSystemDriver, getEnvVariable } from '@men-mvc/config';
import {
  generateUuid as globalGenerateUuid,
  UploadedFile
} from '@men-mvc/foundation';
import path from 'path';
import { isNil } from 'lodash';
import { MultipartRequest } from './types';
// import {resolveValidationError, validateRequestAsync, ValidationError, validationErrorResponse} from "@men-mvc/core";
// import joi from "@men-mvc/core/lib/joi";
import { FileSystem } from './fileSystem'; // TODO: move these to globals

export const getAppStorageDirectory = (): string => {
  let storageDirectory: string;
  const envVarStorageDir = getEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, ``);
  if (envVarStorageDir) {
    storageDirectory = envVarStorageDir;
  } else {
    storageDirectory = path.join(process.cwd(), `storage`);
  }

  return storageDirectory;
};

export const getUploadFilesizeLimit = (): number =>
  baseConfig.fileSystem.maxUploadLimit;

export const getFileSystemDriver = (): FileSystemDriver =>
  baseConfig.fileSystem.storageDriver;

export const generateUuid = (): string => globalGenerateUuid();

export const getDriver = (): FileSystemDriver =>
  baseConfig.fileSystem?.storageDriver ?? FileSystemDriver.local;

//
// export const ValidateMultipartRequestAsync = (schema: joi.ObjectSchema) => {
//   return function (
//       scope: unknown,
//       methodName: string,
//       descriptor: PropertyDescriptor
//   ) {
//     const originalMethod = descriptor.value;
//
//     descriptor.value = async function (
//         req: MultipartRequest<Record<string, unknown>>,
//         res: Response,
//         ...args: unknown[]
//     ) {
//       try {
//         req.parsedFormData = await FileSystem.getInstance().parseFormData(req);
//         await validateRequestAsync(schema, req.parsedFormData);
//       } catch (e) {
//         if (e instanceof ValidationError) {
//           return validationErrorResponse(res, e);
//         } else if (e instanceof joi.ValidationError) {
//           return validationErrorResponse(res, resolveValidationError(e));
//         }
//       }
//
//       return originalMethod.apply(this, [req, res, ...args]);
//     };
//   };
// };
