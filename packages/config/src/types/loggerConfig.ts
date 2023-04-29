import { LogDriver } from './logDriver';

export type LoggerConfig = {
  driver?: LogDriver;
  disabled?: boolean;
  sentry?: {
    dsn: string;
    tracesSampleRate?: number;
  };
};
