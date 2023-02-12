import sinon from 'sinon';
import util from 'util';
import { ConsoleLogMailSender } from '../../../src/mailer/consoleLogMailSender';
import { generateSendMailData } from './testUtilities';

describe(`ConsoleLogMailSender`, () => {
  /**
   * ! code duplication will be gone after we create a separate package for logger.
   */
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

  it(`should inspect and log mail data`, async () => {
    const mailData = generateSendMailData();
    const mailSender = new ConsoleLogMailSender();
    await mailSender.send(mailData);

    assertInspectInvoked(mailData);
    // TODO: how can we assert the parameter of console log?
    expect(mockConsoleLogFunc.mock.calls.length).toBe(1);
  });

  /**
   * ! code duplication will be gone after we create a separate package for logger.
   */
  const assertInspectInvoked = (data: unknown) => {
    expect(mockInspectFunc.mock.calls.length).toBe(1);
    const inspectCall = mockInspectFunc.mock.calls[0];
    expect(inspectCall[0]).toBe(data);
    expect(inspectCall[1]).toBeFalsy();
    expect(inspectCall[2]).toBeNull();
    expect(inspectCall[3]).toBeTruthy();
  };

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
