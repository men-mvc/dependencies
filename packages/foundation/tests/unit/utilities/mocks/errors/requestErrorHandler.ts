import { Request, Response } from 'express';

/**
 * mock request error handler function
 */
export const requestErrorHandler = (
  error: Error,
  req: Request,
  res: Response
): Response => {
  return {
    statusCode: 500
  } as Response;
};
