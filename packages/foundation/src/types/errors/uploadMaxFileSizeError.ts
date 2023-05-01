import { ErrorCodes } from './errorCodes';

export class UploadMaxFileSizeError extends Error {
  public message: string = `Payload is too large.`;
  constructor() {
    super(`Payload is too large.`);
    this.name = ErrorCodes.UPLOAD_MAX_FILESIZE_LIMIT;
  }
}
