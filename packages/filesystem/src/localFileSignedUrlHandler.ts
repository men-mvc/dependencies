import { Request, Response } from 'express';
import { StatusCodes } from '@men-mvc/foundation';
import { getAppBaseUrl, errorResponse } from './foundation';
import { LocalStorage } from './localStorage';
import { getMimeType } from './utilities/utilities';

export const viewLocalSignedUrlRoute = `/private-file/view/:filepath`;

// TODO: unit test
// TODO: finish
export const localFileSignedUrlHandler = async (
  req: Request,
  res: Response
) => {
  const { filepath, hash } = req.params;
  if (!filepath) {
    return errorResponse(res, `Filepath is missing.`, StatusCodes.BAD_REQUEST);
  }
  const decodedFilepath = decodeURIComponent(filepath);
  const localStorage = LocalStorage.getInstance();
  const valid = localStorage.verifySignedUrl(
    `${getAppBaseUrl()}/private-file/view/${decodedFilepath}?hash=${hash}`
  );
  if (!valid) {
    return errorResponse(
      res,
      `Link is no longer valid/ expired.`,
      StatusCodes.BAD_REQUEST
    );
  }

  const mimeType = getMimeType(decodedFilepath);
  if (mimeType) {
    res.contentType(mimeType);
  }

  return (await localStorage.createReadStream(decodedFilepath)).pipe(res);
};
