import { baseConfig, LogDriver } from '@men-mvc/config';

export const getBaseConfig = () => baseConfig;

export const isLoggingDisabled = (): boolean =>
  !!getBaseConfig().logging?.disabled;

export const getLogDriver = (): LogDriver =>
  getBaseConfig().logging?.driver ?? LogDriver.console;

export const getSentryConfig = () => ({
  dsn: getBaseConfig().logging?.sentry?.dsn ?? ``,
  tracesSampleRate: getBaseConfig().logging?.sentry?.tracesSampleRate ?? 1.0
});
