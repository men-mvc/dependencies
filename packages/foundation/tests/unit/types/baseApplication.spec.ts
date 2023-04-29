import express, { Request } from 'express';
import sinon, { SinonSandbox } from 'sinon';
import { BaseApplication, ApplicationEvents } from '../../../src';

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
    TestApplication.clearInstance();
  });

  describe(`getInstance`, () => {
    it(`should throw ApplicationNotInitialisedError`, () => {
      expect(() => {
        TestApplication.getInstance();
      }).toThrow(`Application not initialise yet.`);
    });

    it(`should return application class instance`, () => {
      const app = BaseApplication.init(new TestApplication(expressApp));
      expect(TestApplication.getInstance()).toBe(app);
    });

    // test singleton
    it(`should always return the same instance`, () => {
      const app = BaseApplication.init(new TestApplication(expressApp));
      expect(TestApplication.getInstance()).toBe(app);
      expect(TestApplication.getInstance()).toBe(app);
    });
  });

  describe(`getCurrentRequest & setCurrentRequest`, () => {
    it(`should set and get current request`, () => {
      const app = BaseApplication.init(new TestApplication(expressApp));
      const request = {
        body: {
          name: `test`
        }
      } as Request;
      app.setCurrentRequest(request);
      expect(app.getCurrentRequest()).toBe(request);
    });

    it(`should throw error when current request is not set yet`, () => {
      const app = BaseApplication.init(new TestApplication(expressApp));
      expect(() => {
        app.getCurrentRequest();
      }).toThrow(`Request has not been initialised.`);
    });
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

    it(`should emit ${ApplicationEvents.beforePreMiddlewareRegistered} event`, async () => {
      application.initialiseEventEmitter();
      const spy = sandbox.spy();
    });

    it(`should invoke initialisePreMiddlewares`, async () => {
      application.initialiseEventEmitter();
      const spy = sandbox.spy(TestApplication.getEventEmitter(), `emit`);
      await application.setUp();
      sinon.assert.calledWith(
        spy,
        ApplicationEvents.beforePreMiddlewareRegistered,
        expressApp
      );
    });

    it(`should emit ${ApplicationEvents.beforeRoutesRegistered} event`, async () => {
      application.initialiseEventEmitter();
      const spy = sandbox.spy(TestApplication.getEventEmitter(), `emit`);
      await application.setUp();
      sinon.assert.calledWith(
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
