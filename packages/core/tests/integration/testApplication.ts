import express, { Express } from 'express';
import { baseConfig } from '@men-mvc/config';
import { AbstractApplication } from '../../src/types/abstractApplication';
import { configureTestRoutes } from './testRoutes';
import { registerMultipartFormParser } from '../../src/middlewares/registerMultipartFormParser';

export class TestApplication extends AbstractApplication {
  constructor(public app: Express) {
    super(app);
  }

  public initialise = async () => {};

  public initialisePreMiddlewares = () => {
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());
    registerMultipartFormParser(this.app);
  };

  public registerRoutes = () => {
    configureTestRoutes(this);
  };

  public initialisePostMiddlewares = () => {};

  public start = () => {
    this.app.listen(baseConfig.server.port, () => {
      console.log(
        `⚡️[server]: Test server is running on port ${baseConfig.server.port}`
      );
    });
  };
}

module.exports = {
  TestApplication
};
