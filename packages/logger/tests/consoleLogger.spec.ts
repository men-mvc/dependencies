import sinon from 'sinon';
import util from 'util';
import { faker } from '@faker-js/faker';
import { ConsoleLogger } from '../src/consoleLogger';
import * as utilities from '../src/utilities';

const instance = new ConsoleLogger();
describe(`ConsoleLogger`, () => {
  let consoleLogStub: sinon.SinonStub;
  let mockConsoleLogFunc: jest.Mock;
  let inspectStub: sinon.SinonStub;
  let mockInspectFunc: jest.Mock;
  beforeEach(() => {
    mockUtilInspect();
    mockConsoleLog();
  });
  afterEach(() => {
    inspectStub.restore();
    mockInspectFunc.mockRestore();
    consoleLogStub.restore();
    mockConsoleLogFunc.mockRestore();
  });

  describe(`logError`, () => {
    it(`should inspect and log error`, () => {
      const error = { error: `Something went wrong!` };
      instance.logError(error);
      assertInspectInvoked(error);
      // TODO: how can we assert the parameter of console log?
      expect(mockConsoleLogFunc.mock.calls.length).toBe(1);
    });
  });

  describe(`logMessage`, () => {
    it(`should inspect and log the message`, () => {
      const message = faker.lorem.paragraphs(2);
      instance.logMessage(message);
      assertInspectInvoked(message);
      expect(mockConsoleLogFunc.mock.calls.length).toBe(1);
    });
  });

  describe(`disabled`, () => {
    it(`does not log when the logging is disabled`, () => {
      const isLoggingDisabledStub = stubIsLoggingDisabled(true);
      instance.logMessage(`test message`);
      instance.logError({ error: `Fake error` });

      expect(expect(mockInspectFunc.mock.calls.length).toBe(0));
      expect(mockInspectFunc.mock.calls.length).toBe(0);
      isLoggingDisabledStub.restore();
    });

    const stubIsLoggingDisabled = (returnValue: boolean): sinon.SinonStub => {
      const subjectFuncStub = sinon.stub(utilities, `isLoggingDisabled`);
      return subjectFuncStub.returns(returnValue);
    };
  });

  const assertInspectInvoked = (data: unknown) => {
    expect(mockInspectFunc.mock.calls.length).toBe(1);
    const inspectCall = mockInspectFunc.mock.calls[0];
    expect(inspectCall[0]).toBe(data);
    expect(inspectCall[1]).toBeFalsy();
    expect(inspectCall[2]).toBeNull();
    expect(inspectCall[3]).toBeTruthy();
  };

  /**
   * ! duplicate code: but duplication will be gone once we create a separate package for logger.
   */
  const mockUtilInspect = () => {
    inspectStub = sinon.stub(util, `inspect`);
    mockInspectFunc = jest
      .fn()
      .mockImplementation((arg1, arg2, arg3, arg4) => {});
    inspectStub.callsFake(mockInspectFunc);
  };

  const mockConsoleLog = () => {
    consoleLogStub = sinon.stub(console, `log`);
    mockConsoleLogFunc = jest.fn().mockImplementation((error) => {});
    consoleLogStub.callsFake(mockConsoleLogFunc);
  };
});
