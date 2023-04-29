import { LoggerContract, SentryAdapter } from './types';
import { getSentryConfig } from './utilities';

// TODO: unit test.
export class SentryLogger implements LoggerContract {
  private client: SentryAdapter | undefined;

  public getSentryClient = (): SentryAdapter => {
    if (this.client) {
      return this.client;
    }

    this.client = require('@sentry/node');

    return this.client as SentryAdapter;
  };

  public clearSentryClient = (): void => {
    this.client = undefined;
  };

  public init = (): void => {
    const sentryConfig = getSentryConfig();
    this.getSentryClient().init(sentryConfig);
  };

  public logError = (error: unknown | Error): void => {
    this.getSentryClient().captureException(error);
  };

  public logMessage = (message: string): void => {
    this.getSentryClient().captureMessage(message);
  };
}
