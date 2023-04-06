import { Request, Response } from 'express';
import path from 'path';
import { getServerDirectory } from './app';

declare type RequestErrorHandlerFunc = (
  err: Error,
  req: Request,
  res: Response
) => Response;

// ! module path does not have file extension
export const getApplicationErrorHandlerModulePath = (): string =>
  path.join(getServerDirectory(), 'errors', 'requestErrorHandler');

export const invokeRequestErrorHandler = (
  error: Error,
  req: Request,
  res: Response
): Response => {
  const requestErrorHandler =
    require(getApplicationErrorHandlerModulePath()) as {
      requestErrorHandler: RequestErrorHandlerFunc;
    };

  return requestErrorHandler.requestErrorHandler(error, req, res);
};
