import express, {Express} from 'express';
import { baseConfig } from '@men-mvc/config';
import {BaseApplication} from '@men-mvc/foundation';
import { configureTestRoutes } from './testRoutes';
import { registerFilesystem } from '../../src';

export class TestApplication extends BaseApplication {
  constructor(public app: Express) {
    super(app);
  }

  public initialise = async () => {};

  public initialisePreMiddlewares = () => {
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());
    registerFilesystem(this.app);
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
