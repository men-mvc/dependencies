import { LogDriver } from '@men-mvc/config';
import { LoggerContract } from './types';
import { ConsoleLogger } from './consoleLogger';
import { getLogDriver } from './utilities';
import { SentryLogger } from './sentryLogger';

export class Logger {
  private static instance: LoggerContract | null;

  public static getInstance = (): LoggerContract => {
    if (Logger.instance) {
      return Logger.instance;
    }
    if (getLogDriver() === LogDriver.sentry) {
      Logger.instance = new SentryLogger();
    } else {
      Logger.instance = new ConsoleLogger();
    }

    return Logger.instance;
  };

  public static resetInstance = (): void => {
    Logger.instance = null;
  };
}
