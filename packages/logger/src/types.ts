export interface LoggerContract {
  init: () => Promise<void>;

  logError: (error: unknown | Error) => void;

  logMessage: (message: string) => void;
}

export type SentryAdapter = {
  init: (options: { dsn: string; tracesSampleRate: number }) => void;

  captureException: (error: unknown | Error) => void;

  captureMessage: (message: string) => void;
};

export enum CloudWatchLogCategory {
  error = `ERROR`,
  message = `MESSAGE`
}

export type CloudWatchLogsClientConfig = {
  credentials: {
    secretAccessKey: string;
    accessKeyId: string;
  };
  region: string;
};

export type CloudWatchLogsClient = {
  send: (command: unknown) => Promise<unknown>;
};

export type PutLogsEventsCommandInput = {
  logGroupName: string;
  logStreamName: string;
  logEvents: {
    timestamp: number;
    message: string;
  }[];
};

export type CloudWatchLogsModule = {
  PutLogEventsCommandInput: {
    logGroupName: string;
    logStreamName: string;
    logEvents: {
      // InputLogEvent
      timestamp: number;
      message: string;
    }[];
  };
  PutLogEventsCommand: {
    new (config: PutLogsEventsCommandInput): unknown;
  };
  CloudWatchLogsClient: {
    new (config: CloudWatchLogsClientConfig): CloudWatchLogsClient;
  };
  CreateLogGroupCommand: {
    new (input: { logGroupName: string }): unknown;
  };
  CreateLogStreamCommand: {
    new (input: { logGroupName: string; logStreamName: string }): unknown;
  };
  ResourceAlreadyExistsException: {
    new (message?: string): unknown;
  };
};
