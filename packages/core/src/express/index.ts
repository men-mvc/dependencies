// expose the Express classes to be used by app project.
import coreExpress, {
  Express,
  Request,
  RequestHandler,
  ErrorRequestHandler,
  Application,
  Response,
  NextFunction,
  CookieOptions,
  Errback,
  Handler,
  IRoute,
  IRouter,
  IRouterHandler,
  IRouterMatcher,
  MediaType,
  RequestParamHandler,
  RouterOptions,
  Send
} from 'express';

const express = coreExpress;

export {
  express,
  Express,
  Request,
  RequestHandler,
  ErrorRequestHandler,
  Application,
  Response,
  NextFunction,
  CookieOptions,
  Errback,
  Handler,
  IRoute,
  IRouter,
  IRouterHandler,
  IRouterMatcher,
  MediaType,
  RequestParamHandler,
  Send,
  RouterOptions
};
