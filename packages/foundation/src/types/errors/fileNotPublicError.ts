import { ErrorCodes } from './errorCodes';

export class FileNotPublicError extends Error {
  constructor() {
    super(`File is not public.`);
    this.name = ErrorCodes.FILE_NOT_PUBLIC;
  }
}
