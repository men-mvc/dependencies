import { Request, Response } from 'express';
import { FileNotPublicError, FileSystemDriver } from '@men-mvc/foundation';
import {
  getDriver,
  getMimeType,
  isPublicFilepath
} from '../utilities/utilities';
import { FileSystem } from '..';
import { notFoundResponse } from '../foundation';

export const viewPublicS3ObjectRoute = `/filesystem/s3/:key`;

export const viewPublicS3ObjectRequestHandler = async (
  req: Request,
  res: Response
) => {
  if (getDriver() !== FileSystemDriver.s3) {
    throw new Error(`Filesystem is not using S3 driver.`);
  }
  if (!req.params.key) {
    return notFoundResponse(res, `Key is missing.`);
  }
  const key = decodeURIComponent(req.params.key);
  if (!isPublicFilepath(key)) {
    throw new FileNotPublicError();
  }
  const mimeType = getMimeType(key);
  if (mimeType) {
    res.contentType(mimeType);
  }

  return (await FileSystem.getInstance().createReadStream(key)).pipe(res);
};
