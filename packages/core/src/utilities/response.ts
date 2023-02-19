import { Response } from 'express';
import {
  ErrorResponse,
  ErrorResponseData,
  StatusCodes,
  ValidationError,
  ValidationErrorResponse
} from '../types';
import { InsufficientPermissionError } from '../types/insufficientPermissionError';

export const successResponse = <T>(
  res: Response,
  data: T,
  status: number = StatusCodes.OK
) => {
  return res.status(status).json({
    data
  });
};

export const errorResponse = <T>(
  res: Response,
  error: ErrorResponseData<T> | string,
  status: number
) => {
  let responseData: {
    code?: string;
    message: string;
    details?: T | null;
  };

  if (typeof error === 'string') {
    responseData = {
      message: error
    };
  } else {
    responseData = {
      message: error.message
    };
    if (error.code) {
      responseData.code = error.code;
    }
    if (error.details) {
      responseData.details = error.details;
    }
  }

  return res.status(status).json(new ErrorResponse(responseData));
};

export const notFoundResponse = (res: Response, error: string) => {
  return errorResponse(res, error, StatusCodes.NOT_FOUND);
};

export const emptyResponse = (
  res: Response,
  status: number = StatusCodes.NO_CONTENT
) => {
  return res.status(status).json(null);
};

export const validationErrorResponse = (
  res: Response,
  validationError: ValidationError
) => {
  return res
    .status(StatusCodes.UNPROCESSABLE_ENTITY)
    .json(new ValidationErrorResponse(validationError));
};

export const unauthorisedErrorResponse = (res: Response, message?: string) => {
  return errorResponse(
    res,
    {
      message: message ?? `Unauthorised.`
    },
    StatusCodes.UNAUTHORIZED
  );
};

export const insufficientPermissionsResponse = (
  res: Response,
  error: InsufficientPermissionError
) => {
  return errorResponse(
    res,
    {
      code: error.name,
      message: error.message
    },
    StatusCodes.FORBIDDEN
  );
};
