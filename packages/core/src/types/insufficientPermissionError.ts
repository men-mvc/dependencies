import { ErrorCodes } from '@men-mvc/globals';

export class InsufficientPermissionError extends Error {
  constructor() {
    super(`Insufficient permissions.`);
    this.name = ErrorCodes.INSUFFICIENT_PERMISSIONS;
    this.message = `Insufficient permissions.`;
  }
}
