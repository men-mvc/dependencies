import { ErrorCodes } from './errorCodes';

export class ValidationError extends Error {
  constructor(public errors: { [key: string]: string }) {
    super(`Validation failed.`);
    this.name = ErrorCodes.VALIDATION_ERROR;
    this.message = `Validation failed.`;
  }
}
