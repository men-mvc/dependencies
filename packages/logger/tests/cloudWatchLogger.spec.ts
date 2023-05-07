import sinon, { createSandbox, SinonSandbox } from 'sinon';
import _ from 'lodash';
import { DeepPartial } from '@men-mvc/foundation';
import { faker } from '@faker-js/faker';
import { LogDriver } from '@men-mvc/config';
import { set as setMockDate, reset as resetMockDate } from 'mockdate';
import {
  CloudWatchLogsModule,
  CloudWatchLogsClientConfig,
  CloudWatchLogger,
  PutLogsEventsCommandInput,
  CloudWatchLogCategory
} from '../src';
import { generateBaseConfig } from './testUtilities';
import * as utilities from '../src/utilities';

class FakeCloudWatchLogsClient {
  constructor(config: CloudWatchLogsClientConfig) {}

  public send = (command: unknown): Promise<unknown> =>
    Promise.resolve({
      error: false
    });
}

class FakeResourceAlreadyExistsException {
  constructor(message?: string) {}
}

class FakeCreateLogGroupCommand {
  public input: Record<string, unknown> | undefined;

  constructor(input: { logGroupName: string }) {
    this.input = input;
  }
}

class FakeCreateLogStreamCommand {
  public input: Record<string, unknown> | undefined;

  constructor(input: { logGroupName: string; logStreamName: string }) {
    this.input = input;
  }
}

class FakePutLogEventsCommand {
  public input: PutLogsEventsCommandInput | undefined;

  constructor(input: PutLogsEventsCommandInput) {
    this.input = input;
  }
}

const logger = new CloudWatchLogger();
const fakeCloudWatchConfig = {
  accessKeyId: faker.datatype.uuid(),
  secretAccessKey: faker.datatype.uuid(),
  region: `eu-west-1`,
  logStreamPrefix: faker.lorem.word(),
  logGroupName: faker.lorem.word()
};
describe(`CloudWatchLogger`, () => {
  let sandbox: SinonSandbox;

  beforeAll(() => {
    setMockDate(new Date().toISOString());
  });

  afterAll(resetMockDate);

  beforeEach(() => {
    sandbox = createSandbox();
    stubRequireClientCloudWatchLogs();
    sandbox
      .stub(utilities, `getCloudwatchConfig`)
      .returns(fakeCloudWatchConfig);
  });
  afterEach(() => {
    logger.clearClient();
    logger.clearCloudWatchLogsImport();
    sandbox.restore();
  });

  describe(`importCloudWatchLogs`, () => {
    it(`should always return the same instance`, () => {
      expect(logger.getCloudWatchLogsImport()).toBe(
        logger.getCloudWatchLogsImport()
      );
    });
  });

  describe(`getClient`, () => {
    it(`should return the instance of CloudWatch client class`, () => {
      expect(logger.getClient()).toBeInstanceOf(FakeCloudWatchLogsClient);
    });

    it(`should always return the same instance`, () => {
      expect(logger.getClient()).toBe(logger.getClient());
    });
  });

  describe(`getClientConfig`, () => {
    it(`should return the values from the config`, () => {
      const result = logger.getClientConfig();
      expect(result.region).toBe(fakeCloudWatchConfig.region);
      expect(result.credentials.secretAccessKey).toBe(
        fakeCloudWatchConfig.secretAccessKey
      );
      expect(result.credentials.accessKeyId).toBe(
        fakeCloudWatchConfig.accessKeyId
      );
    });
  });

  describe(`init`, () => {
    it(`should invoke createLogGroup and createLogStream`, async () => {
      const createLogGroupStub = sandbox.stub(logger, `createLogGroup`);
      const createLogStreamStub = sandbox.stub(logger, `createLogStream`);

      await logger.init();

      expect(createLogGroupStub.calledOnce).toBeTruthy();
      expect(createLogStreamStub.calledOnce).toBeTruthy();
    });
  });

  describe(`isResourceAlreadyExistsException`, () => {
    it(`should return true if the error is a ResourceAlreadyExistsException`, () => {
      const result = logger.isResourceAlreadyExistsException(
        new FakeResourceAlreadyExistsException()
      );
      expect(result).toBeTruthy();
    });

    it(`should return false if the error is not a ResourceAlreadyExistsException`, () => {
      const result = logger.isResourceAlreadyExistsException(
        new Error(`Some other error`)
      );
      expect(result).toBeFalsy();
    });
  });

  describe(`createLogGroup`, () => {
    it(`should execute send command with the right input`, async () => {
      const client = logger.getClient();
      const sendStub = sandbox.stub(client, `send`);
      await logger.createLogGroup();
      sinon.assert.calledOnce(sendStub);
      const args = sendStub.getCall(0).args;
      expect(args[0]).toBeInstanceOf(FakeCreateLogGroupCommand);
      const input = (args[0] as FakeCreateLogGroupCommand).input as Record<
        string,
        unknown
      >;
      expect(JSON.stringify(input)).toBe(
        JSON.stringify({
          logGroupName: fakeCloudWatchConfig.logGroupName
        })
      );
    });

    it(`should fail silently when the error is a ResourceAlreadyExistsException`, async () => {
      const client = logger.getClient();
      const sendStub = sandbox.stub(client, `send`).callsFake(() => {
        throw new FakeResourceAlreadyExistsException();
      });
      await logger.createLogGroup();
      sinon.assert.calledOnce(sendStub);
    });

    it(`should throw error when the error is not a ResourceAlreadyExistsException`, async () => {
      const client = logger.getClient();
      sandbox.stub(client, `send`).callsFake(() => {
        throw new Error(`Unknown error`);
      });
      await expect(logger.createLogGroup).rejects.toThrow(`Unknown error`);
    });
  });

  describe(`createLogStream`, () => {
    it(`should execute send command with the right input`, async () => {
      const expectedLogStreamName = `${
        fakeCloudWatchConfig.logStreamPrefix
      }-${new Date().toJSON().slice(0, 10)}`;
      const client = logger.getClient();
      const sendStub = sandbox.stub(client, `send`);
      await logger.createLogStream();
      sinon.assert.calledOnce(sendStub);
      const args = sendStub.getCall(0).args;
      expect(args[0]).toBeInstanceOf(FakeCreateLogStreamCommand);
      const input = (args[0] as FakeCreateLogStreamCommand).input as Record<
        string,
        unknown
      >;
      expect(JSON.stringify(input)).toBe(
        JSON.stringify({
          logGroupName: fakeCloudWatchConfig.logGroupName,
          logStreamName: expectedLogStreamName
        })
      );
    });

    it(`should fail silently when the error is a ResourceAlreadyExistsException`, async () => {
      const client = logger.getClient();
      const sendStub = sandbox.stub(client, `send`).callsFake(() => {
        throw new FakeResourceAlreadyExistsException();
      });
      await logger.createLogStream();
      sinon.assert.calledOnce(sendStub);
    });

    it(`should throw error when the error is not a ResourceAlreadyExistsException`, async () => {
      const client = logger.getClient();
      sandbox.stub(client, `send`).callsFake(() => {
        throw new Error(`Unknown error`);
      });
      await expect(logger.createLogStream).rejects.toThrow(`Unknown error`);
    });
  });

  describe(`logMessage`, () => {
    it(`should invoke send command with the right input`, async () => {
      const client = logger.getClient();
      const sendStub = sandbox.stub(client, `send`);
      await logger.logMessage(`Some message`);
      sinon.assert.calledOnce(sendStub);
      const args = sendStub.getCall(0).args;
      expect(args[0]).toBeInstanceOf(FakePutLogEventsCommand);
      const input = (args[0] as FakePutLogEventsCommand)
        .input as PutLogsEventsCommandInput;
      expect(JSON.stringify(input)).toBe(
        JSON.stringify({
          logGroupName: fakeCloudWatchConfig.logGroupName,
          logStreamName: `${fakeCloudWatchConfig.logStreamPrefix}-${new Date()
            .toJSON()
            .slice(0, 10)}`,
          logEvents: [
            {
              timestamp: new Date().getTime(),
              message: JSON.stringify({
                category: CloudWatchLogCategory.message,
                message: `Some message`
              })
            }
          ]
        })
      );
    });

    it(`should not log message when the logging is disabled`, async () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          logging: {
            disabled: true,
            driver: LogDriver.cloudwatch
          }
        })
      );
      const client = logger.getClient();
      const sendSpy = sandbox.spy(client, `send`);
      await logger.logMessage(`Some message`);
      sinon.assert.notCalled(sendSpy);
    });
  });

  describe(`logError`, () => {
    it(`should invoke send command with the right input`, async () => {
      const client = logger.getClient();
      const sendStub = sandbox.stub(client, `send`);
      await logger.logError({
        code: `UnknownError`,
        message: `Something went wrong`
      });
      sinon.assert.calledOnce(sendStub);
      const args = sendStub.getCall(0).args;
      expect(args[0]).toBeInstanceOf(FakePutLogEventsCommand);
      const input = (args[0] as FakePutLogEventsCommand)
        .input as PutLogsEventsCommandInput;
      expect(JSON.stringify(input)).toBe(
        JSON.stringify({
          logGroupName: fakeCloudWatchConfig.logGroupName,
          logStreamName: `${fakeCloudWatchConfig.logStreamPrefix}-${new Date()
            .toJSON()
            .slice(0, 10)}`,
          logEvents: [
            {
              timestamp: new Date().getTime(),
              message: JSON.stringify({
                category: CloudWatchLogCategory.error,
                error: {
                  code: `UnknownError`,
                  message: `Something went wrong`
                }
              })
            }
          ]
        })
      );
    });

    it(`should not log error when logging is disabled`, async () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          logging: {
            disabled: true,
            driver: LogDriver.cloudwatch
          }
        })
      );
      const client = logger.getClient();
      const sendSpy = sandbox.spy(client, `send`);
      await logger.logError(`Some message`);
      sinon.assert.notCalled(sendSpy);
    });
  });

  const stubRequireClientCloudWatchLogs = (
    module: DeepPartial<CloudWatchLogsModule> = {}
  ) => {
    return sandbox.stub(logger, `requireClientCloudWatchLogs`).returns(
      _.merge(
        {
          CloudWatchLogsClient: FakeCloudWatchLogsClient,
          ResourceAlreadyExistsException: FakeResourceAlreadyExistsException,
          CreateLogGroupCommand: FakeCreateLogGroupCommand,
          CreateLogStreamCommand: FakeCreateLogStreamCommand,
          PutLogEventsCommand: FakePutLogEventsCommand
        },
        module
      ) as CloudWatchLogsModule
    );
  };
});
