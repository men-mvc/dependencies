import { TestApplication } from './testApplication';
import express, { Express } from 'express';

let application: TestApplication | null;
export const initTestApplication = async (): Promise<TestApplication> => {
  if (!application) {
    const app: Express = express();
    application = new TestApplication(app);
    await application.setUp();
  }
  return application;
};

export const getTestExpressApp = async (): Promise<Express> => {
  if (!application) {
    application = await initTestApplication();
  }

  return application.app;
};
