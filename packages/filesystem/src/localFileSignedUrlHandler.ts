import { Request, Response } from 'express';
import { FileSystemDriver, StatusCodes } from '@men-mvc/foundation';
import { getAppBaseUrl, errorResponse } from './foundation';
import { LocalStorage } from './localStorage';
import { getDriver, getMimeType } from './utilities/utilities';
import { FileSystem } from '.';

export const viewLocalSignedUrlRoute = `/private-file/view/:filepath`;

// TODO: register in the middleware and test it too.
export const localFileSignedUrlHandler = async (
  req: Request,
  res: Response
) => {
  if (getDriver() !== FileSystemDriver.local) {
    throw new Error(`Filesystem is not using local driver.`);
  }
  const { filepath, hash } = req.params;
  if (!filepath) {
    return errorResponse(res, `Filepath is missing.`, StatusCodes.BAD_REQUEST);
  }
  const fileSystem = FileSystem.getInstance() as FileSystem;
  const localStorage = fileSystem.getStorageInstance() as LocalStorage;
  const valid = localStorage.verifySignedUrl(
    `${getAppBaseUrl()}/private-file/view/${filepath}?hash=${hash}`
  );
  if (!valid) {
    return errorResponse(
      res,
      `Link is no longer valid/ expired.`,
      StatusCodes.BAD_REQUEST
    );
  }

  const decodedFilepath = decodeURIComponent(filepath);

  const mimeType = getMimeType(decodedFilepath);
  if (mimeType) {
    res.contentType(mimeType);
  }

  return (await fileSystem.createReadStream(decodedFilepath)).pipe(res);
};
