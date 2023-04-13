import express, { Express } from 'express';
import { BaseApplication } from '../../../src';
import sinon, { SinonSandbox } from 'sinon';
import { ApplicationEvents } from '../../../lib';

class TestApplication extends BaseApplication {
  initialise = () => {};

  registerRoutes = () => {
    // do nothing
  };

  initialisePostMiddlewares = () => {
    // do nothing
  };

  initialisePreMiddlewares = () => {
    // do nothing
  };

  start = () => {
    // do nothing
  };
}
const expressApp = express();
const application = new TestApplication(expressApp);

describe(`BaseApplication`, () => {
  let sandbox: SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
    TestApplication.clearEventEmitter();
  });

  describe(`setUp`, () => {
    it(`should initialise eventEmitter`, async () => {
      expect(() => {
        TestApplication.getEventEmitter();
      }).toThrow(`Application event emitter has not been initialised yet.`);
      await application.setUp();
      expect(TestApplication.getEventEmitter()).not.toBeNull();
      expect(TestApplication.getEventEmitter()).not.toBeUndefined();
    });

    it(`should invoke initialise`, async () => {
      const spy = sandbox.spy(application, `initialise`);
      await application.setUp();
      sinon.assert.calledOnce(spy);
    });

    it(`should invoke initialisePreMiddlewares`, async () => {
      const spy = sandbox.spy(application, `initialisePreMiddlewares`);
      await application.setUp();
      sinon.assert.calledOnce(spy);
    });

    it(`should emit ${ApplicationEvents.beforeRoutesRegistered} event`, async () => {
      application.initialiseEventEmitter();
      const spy = sandbox.spy(TestApplication.getEventEmitter(), `emit`);
      await application.setUp();
      sinon.assert.calledOnceWithExactly(
        spy,
        ApplicationEvents.beforeRoutesRegistered,
        expressApp
      );
    });

    it(`should invoke registerRoutes`, async () => {
      const spy = sandbox.spy(application, `registerRoutes`);
      await application.setUp();
      sinon.assert.calledOnce(spy);
    });

    it(`should invoke initialisePostMiddlewares`, async () => {
      const spy = sandbox.spy(application, `initialisePostMiddlewares`);
      await application.setUp();
      sinon.assert.calledOnce(spy);
    });
  });
});
