export interface LoggerContract {
  init: () => void;

  logError: (error: unknown | Error) => void;

  logMessage: (message: string) => void;
}

export type SentryAdapter = {
  init: (options: { dsn: string; tracesSampleRate: number }) => void;

  captureException: (error: unknown | Error) => void;

  captureMessage: (message: string) => void;
};
