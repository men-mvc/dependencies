import { LoggerContract } from './types';
import { Logger } from './logger';

export const logger: LoggerContract = Logger.getInstance();

export * from './consoleLogger';
export * from './types';
export * from './logger';
export * from './utilities';
export * from './sentryLogger';
