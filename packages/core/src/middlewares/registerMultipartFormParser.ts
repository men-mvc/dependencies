import { Express, Request, Response, NextFunction } from 'express';
import fileUpload from 'express-fileupload';
import { asyncRequestHandler } from '../utilities';
import { fileSystem } from '../fileSystem';
import { getUploadFilesizeLimit } from '../fileSystem';

const clearTempFiles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.on(`finish`, async () => {
    await fileSystem.clearTempUploadDirectory();
  });
  return next();
};

export const registerMultipartFormParser = (app: Express) => {
  app.use(asyncRequestHandler(clearTempFiles));
  app.use(
    fileUpload({
      limits: { fileSize: getUploadFilesizeLimit() },
      useTempFiles: true,
      tempFileDir: fileSystem.getTempUploadDirectory(),
      // parseNested: true,
      // safeFileNames: true
      // uploadTimeout: 60000 // default
      createParentPath: true
      // abortOnLimit: true,
      // responseOnLimit: `File size limit has been reached`,
      // debug: true
    })
  );
};
