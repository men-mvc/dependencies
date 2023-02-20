import { baseConfig } from '@men-mvc/config';

export const isLoggingDisabled = (): boolean =>
  baseConfig.logging?.disabled ? true : false;
