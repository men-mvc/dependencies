import { BaseConfig } from './types/baseConfig';
import { Config } from './config';

export const config: BaseConfig = Config.getInstance();

export * from './appConfigUtility';
export * from './types';
export * from './baseConfigUtility';
export * from './config';
export * from './coreTestConfigUtility';
export * from './globals';
export * from './utilities';
