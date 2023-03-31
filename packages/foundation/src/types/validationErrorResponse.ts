import { ValidationError } from './validationError';
import { ErrorResponse } from './errorResponse';

export class ValidationErrorResponse extends ErrorResponse<{
  [key: string]: string;
}> {
  constructor(validationError: ValidationError) {
    super({
      code: validationError.name,
      message: `Validation failed.`,
      details: validationError.errors
    });
  }
}
