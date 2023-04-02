import { Request, Response } from 'express';
import { getServerDirectory } from '@men-mvc/essentials';
import path from 'path';

declare type RequestErrorHandlerFunc = (
  err: Error,
  req: Request,
  res: Response
) => Response;

// TODO: unit test
// ! module path does not have file extension
export const getApplicationErrorHandlerModulePath = (): string =>
  path.join(getServerDirectory(), 'errors', 'requestErrorHandler');

// TODO: unit test if possible
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
