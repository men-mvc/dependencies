import sinon, { createSandbox, SinonSandbox } from 'sinon';
import { SentryAdapter, SentryLogger } from '../src';
import * as utilities from '../src/utilities';
import { faker } from '@faker-js/faker';
import { generateBaseConfig } from './testUtilities';

const dsn = faker.internet.url();
const tracesSampleRate = faker.datatype.number();
const loggingConfig = {
  sentry: {
    dsn,
    tracesSampleRate
  }
};
const fakeClient: SentryAdapter = {
  init: jest.fn(),
  captureMessage: (message: string) => {
    jest.fn();
  },
  captureException: (error: unknown | Error) => {
    jest.fn();
  }
};
const sentryLogger = new SentryLogger();
describe(`SentryLogger`, () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
    sandbox.stub(sentryLogger, `getSentryClient`).returns(fakeClient);
    sandbox.stub(utilities, `getBaseConfig`).returns(
      generateBaseConfig({
        logging: loggingConfig
      })
    );
  });

  afterEach(() => {
    sandbox.restore();
    sentryLogger.clearSentryClient();
  });

  describe(`getSentryClient`, () => {
    it(`should return the client`, () => {
      expect(sentryLogger.getSentryClient()).toBeDefined();
    });

    it(`should return the same client`, () => {
      expect(sentryLogger.getSentryClient()).toEqual(
        sentryLogger.getSentryClient()
      );
    });
  });

  describe(`init`, () => {
    it(`should initialise sentry with the right configuration`, () => {
      const initSpy = sinon.spy(sentryLogger.getSentryClient(), 'init');
      sentryLogger.init();

      sinon.assert.calledOnceWithExactly(initSpy, {
        dsn,
        tracesSampleRate
      });
    });
  });

  describe(`logError`, () => {
    it(`should invoke captureException`, () => {
      const captureExceptionStub = sinon.stub(
        sentryLogger.getSentryClient(),
        'captureException'
      );
      const error = new Error(`test`);
      sentryLogger.logError(error);

      sinon.assert.calledOnceWithExactly(captureExceptionStub, error);
    });
  });

  describe(`logMessage`, () => {
    it(`should invoke captureMessage`, () => {
      const captureMessageStub = sinon.stub(
        sentryLogger.getSentryClient(),
        'captureMessage'
      );
      const message = faker.lorem.sentence();
      sentryLogger.logMessage(message);

      sinon.assert.calledOnceWithExactly(captureMessageStub, message);
    });
  });
});
