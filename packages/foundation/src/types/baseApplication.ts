import { Express } from 'express';
import EventEmitter from 'events';
import { ApplicationEvents } from './applicationEvents';

export abstract class BaseApplication {
  constructor(protected app: Express) {}
  private static eventEmitter: EventEmitter | null;

  public setUp = async () => {
    this.initialiseEventEmitter();
    await this.initialise();
    await this.initialisePreMiddlewares();
    BaseApplication.getEventEmitter().emit(
      ApplicationEvents.beforeRoutesRegistered,
      this.app
    );
    await this.registerRoutes();
    await this.initialisePostMiddlewares();
  };

  public initialiseEventEmitter = () => {
    if (BaseApplication.eventEmitter) {
      return;
    }
    BaseApplication.eventEmitter = new EventEmitter();
  };

  public static getEventEmitter = (): EventEmitter => {
    if (!BaseApplication.eventEmitter) {
      throw new Error(
        'Application event emitter has not been initialised yet.'
      );
    }

    return BaseApplication.eventEmitter;
  };

  /**
   * ! we encourage you not to invoke this function unless you have a deep understanding of how MEN MVC framework works
   */
  public static clearEventEmitter = () => {
    BaseApplication.eventEmitter = null;
  };

  abstract initialise: () => Promise<void> | void;

  abstract initialisePreMiddlewares: () => Promise<void> | void;

  abstract registerRoutes: () => Promise<void> | void;

  abstract initialisePostMiddlewares: () => Promise<void> | void;

  abstract start: () => void;
}
