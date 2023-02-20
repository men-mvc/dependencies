export interface LoggerContract {
  logError: <T>(error: Error | T) => void;

  logMessage: (message: string) => void;
}
