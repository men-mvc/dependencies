import {
  CloudWatchLogCategory,
  CloudWatchLogsClient,
  CloudWatchLogsModule,
  LoggerContract
} from './types';
import { getCloudwatchConfig, isLoggingDisabled } from './utilities';

/**
 * ! dependency - @aws-sdk/client-cloudwatch-logs
 */
export class CloudWatchLogger implements LoggerContract {
  private client: CloudWatchLogsClient | undefined;
  private cloudWatchLogsImport: CloudWatchLogsModule | undefined;

  private formatLogData = (
    category: CloudWatchLogCategory,
    data: unknown
  ): Record<string, unknown> => {
    if (category === CloudWatchLogCategory.message) {
      return {
        category: CloudWatchLogCategory.message,
        message: data
      };
    } else {
      return {
        category: CloudWatchLogCategory.error,
        error: data
      };
    }
  };

  private log = async (data: unknown) => {
    if (isLoggingDisabled()) {
      // does not log when the logging is disabled.
      return;
    }

    const config = getCloudwatchConfig();
    const aws = this.getCloudWatchLogsImport();
    const command = new aws.PutLogEventsCommand({
      logGroupName: config.logGroupName, // required
      logStreamName: this.getLogStreamName(), // required
      logEvents: [
        // InputLogEvents // required
        {
          // InputLogEvent
          timestamp: new Date().getTime(), // required
          message: JSON.stringify(data) // required
        }
      ]
    });
    await this.getClient().send(command);
  };

  public requireClientCloudWatchLogs = (): CloudWatchLogsModule => {
    return require('@aws-sdk/client-cloudwatch-logs');
  };

  public getCloudWatchLogsImport = (): CloudWatchLogsModule => {
    if (this.cloudWatchLogsImport) {
      return this.cloudWatchLogsImport;
    }
    this.cloudWatchLogsImport = this.requireClientCloudWatchLogs();

    return this.cloudWatchLogsImport;
  };

  public clearCloudWatchLogsImport = (): void => {
    this.cloudWatchLogsImport = undefined;
  };

  public getClientConfig = () => {
    const config = getCloudwatchConfig();

    return {
      credentials: {
        secretAccessKey: config.secretAccessKey,
        accessKeyId: config.accessKeyId
      },
      region: config.region
    };
  };

  public getClient = (): CloudWatchLogsClient => {
    if (this.client) {
      return this.client;
    }
    const aws = this.getCloudWatchLogsImport();
    this.client = new aws.CloudWatchLogsClient(this.getClientConfig());

    return this.client;
  };

  public clearClient = () => {
    this.client = undefined;
  };

  public init = async (): Promise<void> => {
    await this.createLogGroup();
    await this.createLogStream();
  };

  public isResourceAlreadyExistsException = (error: unknown): boolean => {
    return (
      error instanceof
      this.getCloudWatchLogsImport().ResourceAlreadyExistsException
    );
  };

  public logError = (error: unknown | Error) =>
    this.log(this.formatLogData(CloudWatchLogCategory.error, error));

  public logMessage = (message: string) =>
    this.log(this.formatLogData(CloudWatchLogCategory.message, message));

  public createLogGroup = async (): Promise<void> => {
    try {
      const config = getCloudwatchConfig();
      const aws = this.getCloudWatchLogsImport();
      const command = new aws.CreateLogGroupCommand({
        logGroupName: config.logGroupName
      });
      await this.getClient().send(command);
    } catch (e) {
      if (!this.isResourceAlreadyExistsException(e)) {
        throw e;
      }
    }
  };

  public createLogStream = async (): Promise<void> => {
    try {
      const config = getCloudwatchConfig();
      const aws = this.getCloudWatchLogsImport();
      const command = new aws.CreateLogStreamCommand({
        logGroupName: config.logGroupName,
        logStreamName: this.getLogStreamName()
      });
      await this.getClient().send(command);
    } catch (e) {
      if (!this.isResourceAlreadyExistsException(e)) {
        throw e;
      }
    }
  };

  private getLogStreamName = () =>
    `${getCloudwatchConfig().logStreamPrefix}-${new Date()
      .toJSON()
      .slice(0, 10)}`;
}
