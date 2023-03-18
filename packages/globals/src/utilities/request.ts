import { Request, Response, NextFunction, RequestHandler } from 'express';

export const requestHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Response | void
): RequestHandler => {
  return (
    wrapperReq: Request,
    wrapperRes: Response,
    wrapperNext: NextFunction
  ) => {
    try {
      fn(wrapperReq, wrapperRes, wrapperNext);
    } catch (e) {
      return wrapperNext(e);
    }
  };
};

export const asyncRequestHandler = (
  fn: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<Response | void>
): RequestHandler => {
  return async (
    wrapperReq: Request,
    wrapperRes: Response,
    wrapperNext: NextFunction
  ) => {
    try {
      await fn(wrapperReq, wrapperRes, wrapperNext);
    } catch (e) {
      return wrapperNext(e);
    }
  };
};
