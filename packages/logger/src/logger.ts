import { LoggerContract } from './types';
import { ConsoleLogger } from './consoleLogger';

export class Logger {
  // TODO: do not use static
  private static instance: LoggerContract | null;

  public static getInstance = (): LoggerContract => {
    if (!Logger.instance) {
      /**
       * Replace with the instance of your own custom logger class if you want to use your own logger
       */
      Logger.instance = new ConsoleLogger();
    }
    return Logger.instance;
  };

  public static resetInstance = (): void => {
    Logger.instance = null;
  };
}
