import { Express, Request } from 'express';
import EventEmitter from 'events';
import { ApplicationNotInitialisedError } from './applicationNotInitialisedError';

export abstract class BaseApplication {
  constructor(public app: Express) {}

  /**
   * TODO: add functionalities
   */
  private static eventEmitter: EventEmitter | null;
  private static instance: BaseApplication | null;
  private currentRequest: Request | null = null;

  public static init = <T extends BaseApplication>(application: T): T => {
    BaseApplication.instance = application;

    return BaseApplication.instance as T;
  };

  public setCurrentRequest = (currentRequest: Request) => {
    this.currentRequest = currentRequest;
  };

  public getCurrentRequest = (): Request => {
    if (!this.currentRequest) {
      throw new Error(`Request has not been initialised.`);
    }

    return this.currentRequest;
  };

  public static getInstance = <T extends BaseApplication>(): T => {
    if (!BaseApplication.instance) {
      throw new ApplicationNotInitialisedError();
    }

    return BaseApplication.instance as T;
  };

  public setUp = async () => {
    this.initialiseEventEmitter();
    await this.initialise();
    await this.initialisePreMiddlewares();
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

  /**
   * ! we encourage you not to invoke this function unless you have a deep understanding of how MEN MVC framework works
   */
  public static clearInstance = () => {
    BaseApplication.instance = null;
  };

  abstract getController: <T>(token: string) => T;

  abstract initialise: () => Promise<void> | void;

  abstract initialisePreMiddlewares: () => Promise<void> | void;

  abstract registerRoutes: () => Promise<void> | void;

  abstract initialisePostMiddlewares: () => Promise<void> | void;

  abstract start: () => void;
}
