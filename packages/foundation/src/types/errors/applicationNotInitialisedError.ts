import { ErrorCodes } from './errorCodes';

export class ApplicationNotInitialisedError extends Error {
  constructor() {
    super(`Application not initialise yet.`);
    this.name = ErrorCodes.APPLICATION_NOT_INITIALISED_YET;
  }
}
