import util from 'util';
import { LoggerContract } from './types';
import { isLoggingDisabled } from './utilities';

export class ConsoleLogger implements LoggerContract {
  private log = (data: unknown) => {
    if (isLoggingDisabled()) {
      // does not log when the logging is disabled.
      return;
    }

    console.log(util.inspect(data, false, null, true));
  };

  logError = (error: unknown | Error) => this.log(error);

  logMessage = (message: string) => this.log(message);
}
