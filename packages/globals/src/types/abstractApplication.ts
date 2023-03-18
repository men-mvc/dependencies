import { Express } from 'express';

export abstract class AbstractApplication {
  protected constructor(app: Express) {}

  public setUp = async () => {
    await this.initialise();
    await this.initialisePreMiddlewares();
    await this.registerRoutes();
    await this.initialisePostMiddlewares();
  };

  abstract initialise: () => Promise<void> | void;

  abstract initialisePreMiddlewares: () => Promise<void> | void;

  abstract registerRoutes: () => Promise<void> | void;

  abstract initialisePostMiddlewares: () => Promise<void> | void;

  abstract start: () => void;
}
