import { Request, Response } from 'express';
import joi from 'joi';

export interface RequestValidator {
  getSchema(req: Request, res?: Response): joi.ObjectSchema;
}

export const isRequestValidator = (
  input: unknown
): input is RequestValidator => {
  if (typeof input !== 'object' || input === null) {
    return false;
  }

  return 'getSchema' in input && typeof input.getSchema === 'function';
};
