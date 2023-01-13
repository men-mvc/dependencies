import { Request, Response, NextFunction, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';

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

export const extractBearerToken = (request: Request): string | null => {
  const authHeader = request.header('Authorization');
  if (!authHeader) {
    return null;
  }
  const tokens = authHeader.split(' ');
  if (tokens.length !== 2) {
    return null;
  }
  if (tokens[0] !== 'Bearer') {
    return null;
  }

  return tokens[1] ? tokens[1] : null;
};

export const generateRequestId = (): string =>
  `request-id_${uuidv4()}_${new Date().getTime().toString()}`;
