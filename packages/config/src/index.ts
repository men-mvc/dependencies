import { BaseConfig } from './types';
import { Config } from './config';

export const baseConfig: BaseConfig = Config.getConfig();

export * from './types';
export * from './config';
export * from './appProjectConfig';
export * from './frameworkTestConfig';
export * from './configValidator';
export * from './globals';
export * from './utilities';
export * from '@men-mvc/foundation';
