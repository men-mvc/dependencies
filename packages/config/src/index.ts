import { BaseConfig } from './types/baseConfig';
import { Config } from './config';

// TODO: rename this to baseConfig?
export const config: BaseConfig = Config.getConfig();

export * from './types';
export * from './config';
export * from './appProjectConfig';
export * from './frameworkTestConfig';
export * from './configValidator';
export * from './globals';
export * from './utilities';
