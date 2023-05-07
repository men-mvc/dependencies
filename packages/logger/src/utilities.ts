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

export const getCloudwatchConfig = () => ({
  logGroupName: getBaseConfig().logging?.cloudwatch?.logGroupName ?? ``,
  region: getBaseConfig().logging?.cloudwatch?.region ?? ``,
  accessKeyId: getBaseConfig().logging?.cloudwatch?.accessKeyId ?? ``,
  secretAccessKey: getBaseConfig().logging?.cloudwatch?.secretAccessKey ?? ``,
  logStreamPrefix: getBaseConfig().logging?.cloudwatch?.logStreamPrefix ?? `men`
});
