import { Request, Response } from 'express';
import { FileSystemDriver, StatusCodes } from '@men-mvc/foundation';
import { getAppBaseUrl, errorResponse } from './foundation';
import { LocalStorage } from './localStorage';
import { getDriver, getMimeType } from './utilities/utilities';
import { FileSystem } from '.';

export const viewLocalSignedUrlRoute = `/private-file/view/:filepath`;

export const localFileSignedUrlHandler = async (
  req: Request,
  res: Response
) => {
  if (getDriver() !== FileSystemDriver.local) {
    throw new Error(`Filesystem is not using local driver.`);
  }
  const { filepath } = req.params;
  const { hash } = req.query;
  if (!filepath) {
    return errorResponse(res, `Filepath is missing.`, StatusCodes.BAD_REQUEST);
  }
  const fileSystem = FileSystem.getInstance() as FileSystem;
  const localStorage = fileSystem.getStorageInstance() as LocalStorage;
  const valid = localStorage.verifySignedUrl(
    `${getAppBaseUrl()}/private-file/view/${encodeURIComponent(
      filepath
    )}?hash=${hash}`
  );
  if (!valid) {
    return errorResponse(
      res,
      `Link is no longer valid/ expired.`,
      StatusCodes.BAD_REQUEST
    );
  }

  const mimeType = getMimeType(filepath);
  if (mimeType) {
    res.contentType(mimeType);
  }

  return (await fileSystem.createReadStream(filepath)).pipe(res);
};
