import { ErrorCodes } from './errorCodes';

const defaultError = `Insufficient permissions.`;

export class InsufficientPermissionError extends Error {
  constructor(message?: string) {
    super(message ?? defaultError);
    this.name = ErrorCodes.INSUFFICIENT_PERMISSIONS;
    this.message = message ?? defaultError;
  }
}
