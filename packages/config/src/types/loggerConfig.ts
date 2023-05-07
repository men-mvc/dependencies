import { LogDriver } from './logDriver';

export type LoggerConfig = {
  driver?: LogDriver;
  disabled?: boolean;
  sentry?: {
    dsn: string;
    tracesSampleRate?: number;
  };
  cloudwatch?: {
    logGroupName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    logStreamPrefix?: string;
  }
};
