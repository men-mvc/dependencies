import util from 'util';
import { LoggerContract } from './types';

export default class ConsoleLogger implements LoggerContract {
  logError = <T>(error: T | Error) => {
    console.log(util.inspect(error, false, null, true));
  };

  logMessage = (message: string) => {
    console.log(util.inspect(message, false, null, true));
  };
}
