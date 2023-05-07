import { LogDriver } from '@men-mvc/config';
import { LoggerContract } from './types';
import { ConsoleLogger } from './consoleLogger';
import { getLogDriver } from './utilities';
import { SentryLogger } from './sentryLogger';
import { CloudWatchLogger } from './cloudWatchLogger';

export class Logger {
  private static instance: LoggerContract | null;

  public static getInstance = (): LoggerContract => {
    if (Logger.instance) {
      return Logger.instance;
    }
    switch (getLogDriver()) {
      case LogDriver.sentry: {
        Logger.instance = new SentryLogger();
        break;
      }
      case LogDriver.cloudwatch: {
        Logger.instance = new CloudWatchLogger();
        break;
      }
      default: {
        Logger.instance = new ConsoleLogger();
        break;
      }
    }

    return Logger.instance;
  };

  public static resetInstance = (): void => {
    Logger.instance = null;
  };
}
