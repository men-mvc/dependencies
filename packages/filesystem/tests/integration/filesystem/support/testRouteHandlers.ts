import { Request, Response } from 'express';
import { fileSystem } from '../../../../src';
import {
  ComplexFormData,
  SimpleFormData,
  StoreFileFormData,
  StoreFilesFormData
} from './types';

export const routeHandlerParseForm = async (req: Request, res: Response) => {
  try {
    const formData = await fileSystem.parseFormData<
      ComplexFormData | SimpleFormData
    >(req);

    return res.json({
      data: formData
    });
  } catch (e) {
    return res.json({
      error: e
    });
  }
};

export const routeHandlerStoreFile = async (req: Request, res: Response) => {
  try {
    const formData = (await fileSystem.parseFormData(req)) as StoreFileFormData;
    await fileSystem.storeFile({
      uploadedFile: formData.file,
      filename: formData.filename,
      directory: formData.directory
    });

    return res.json({
      error: false
    });
  } catch (e) {
    return res.json({
      error: e
    });
  }
};

export const routeHandlerStoreFiles = async (req: Request, res: Response) => {
  try {
    const formData = (await fileSystem.parseFormData(
      req
    )) as StoreFilesFormData;
    await fileSystem.storeFiles({
      uploadedFiles: formData.files,
      directory: formData.directory
    });

    return res.json({
      error: false
    });
  } catch (e) {
    return res.json({
      error: e
    });
  }
};
