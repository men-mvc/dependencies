import { Express, Request, Response, NextFunction } from 'express';
import fileUpload from 'express-fileupload';
import { asyncRequestHandler } from '@men-mvc/foundation';
import { existsAsync, getUploadFilesizeLimit } from '../utilities/utilities';
import { FileSystem, fileSystem, getPrivateStorageDirectory } from '..';
import {
  getStorageDirectory,
  getPublicStorageDirectory,
  mkdirAsync
} from '../utilities/utilities';
import {
  viewPublicS3ObjectRequestHandler,
  viewPublicS3ObjectRoute
} from '../s3/viewPublicS3ObjectHandler';
import {
  localFileSignedUrlHandler,
  viewLocalSignedUrlRoute
} from '../localFileSignedUrlHandler';

export const clearTempFiles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.on(`finish`, async () => {
    await fileSystem.clearTempUploadDirectory();
  });
  return next();
};

export const createStorageDirectoryIfNeeded = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (FileSystem.storageDirCreated) {
    return next();
  }

  if (!(await existsAsync(getStorageDirectory()))) {
    await mkdirAsync(getStorageDirectory(), {
      recursive: true
    });
  }
  if (!(await existsAsync(getPublicStorageDirectory()))) {
    await mkdirAsync(getPublicStorageDirectory(), {
      recursive: true
    });
  }
  if (!(await existsAsync(getPrivateStorageDirectory()))) {
    await mkdirAsync(getPrivateStorageDirectory(), {
      recursive: true
    });
  }

  FileSystem.storageDirCreated = true;

  return next();
};

export const registerFilesystem = (app: Express) => {
  app.use(asyncRequestHandler(createStorageDirectoryIfNeeded));
  app.use(asyncRequestHandler(clearTempFiles));
  app.use;
  app.use(
    fileUpload({
      limits: { fileSize: getUploadFilesizeLimit() },
      useTempFiles: true,
      tempFileDir: fileSystem.getAbsoluteTempUploadDirPath(),
      // parseNested: true,
      // safeFileNames: true
      // uploadTimeout: 60000 // default
      createParentPath: true
      // abortOnLimit: true,
      // responseOnLimit: `File size limit has been reached`,
      // debug: true
    })
  );
  app.get(
      viewPublicS3ObjectRoute,
      asyncRequestHandler(viewPublicS3ObjectRequestHandler)
  );
  app.get(
      viewLocalSignedUrlRoute,
      asyncRequestHandler(localFileSignedUrlHandler)
  );
};
