import sinon, { SinonStub } from 'sinon';
import { Readable } from 'stream';
import { Buffer } from 'buffer';
import { faker } from '@faker-js/faker';
import {
  CopyObjectCommand,
  CopyObjectCommandOutput,
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  DeleteObjectsCommand,
  DeleteObjectsCommandOutput,
  GetObjectCommand,
  GetObjectCommandOutput,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  PutObjectCommand,
  PutObjectCommandOutput
} from '@aws-sdk/client-s3';
import { ReadableString, readReadableAsString } from '@men-mvc/globals';
import { MenS3Adapter } from '../src';
import * as utilities from '../src/utilities';

const adapter = new MenS3Adapter();
const fakeBucketName = `fake-bucket`;
describe(`MenS3Adapter Utility`, () => {
  let getAwsBucketNameStub: SinonStub;
  let sendStub: SinonStub;

  beforeAll(() => {
    getAwsBucketNameStub = mockGetAwsS3Bucket();
  });

  afterAll(() => {
    getAwsBucketNameStub.restore();
  });

  afterEach(() => {
    if (sendStub) {
      sendStub.restore();
    }
  });

  describe(`getS3Client`, () => {
    it(`should always return the same instance`, () => {
      const instance1 = adapter.getS3Client();
      const instance2 = adapter.getS3Client();
      expect(instance1).toBe(instance2);
    });
  });

  describe(`createReadStream`, () => {
    it(`should invoke send passing the GetObjectCommand instance with the right parameters`, async () => {
      const expectedOutput = {
        VersionId: faker.datatype.uuid(),
        Body: new ReadableString(`testing`) as Readable
      } as GetObjectCommandOutput;
      sendStub = mockSend(expectedOutput);
      await adapter.createReadStream(`mock/key`);

      sinon.assert.calledOnce(sendStub);
      const sendCall = sendStub.getCalls()[0];
      expect(sendCall.args[0] instanceof GetObjectCommand).toBeTruthy();
      const command = sendCall.args[0] as GetObjectCommand;
      expect(command.input.Bucket).toBe(fakeBucketName);
      expect(command.input.Key).toBe(`mock/key`);
    });

    it(`should return the expected readable data`, async () => {
      sendStub = mockSend({
        VersionId: faker.datatype.uuid(),
        Body: new ReadableString(`testing`) as Readable
      } as GetObjectCommandOutput);
      const resultStream = await adapter.createReadStream(`mock/key`);

      expect(await readReadableAsString(resultStream)).toBe(`testing`);
    });
  });

  describe(`copy`, () => {
    it(`should invoke send passing CopyObjectCommand instance with the right parameters`, async () => {
      const fromKey = faker.datatype.uuid();
      const toKey = faker.datatype.uuid();
      sendStub = mockSend({} as CopyObjectCommandOutput);
      await adapter.copy(fromKey, toKey);

      sinon.assert.calledOnce(sendStub);
      const sendCall = sendStub.getCalls()[0];
      expect(sendCall.args[0] instanceof CopyObjectCommand).toBeTruthy();
      const command = sendCall.args[0] as CopyObjectCommand;
      expect(command.input.CopySource).toBe(`${fakeBucketName}/${fromKey}`);
      expect(command.input.Bucket).toBe(fakeBucketName);
      expect(command.input.Key).toBe(toKey);
    });
  });

  describe(`rename`, () => {
    it(`should invoke send passing CopyObjectCommand instance with the right parameters`, async () => {
      const fromKey = faker.datatype.uuid();
      const toKey = faker.datatype.uuid();
      sendStub = mockSend({} as CopyObjectCommandOutput);
      await adapter.rename(fromKey, toKey);

      sinon.assert.calledTwice(sendStub); // copy and delete
      const copySendCall = sendStub.getCalls()[0];
      expect(copySendCall.args[0] instanceof CopyObjectCommand).toBeTruthy();
      const command = copySendCall.args[0] as CopyObjectCommand;
      expect(command.input.CopySource).toBe(`${fakeBucketName}/${fromKey}`);
      expect(command.input.Bucket).toBe(fakeBucketName);
      expect(command.input.Key).toBe(toKey);
    });

    it(`should invoke send passing DeleteObjectCommand instance with the right parameters`, async () => {
      const fromKey = faker.datatype.uuid();
      const toKey = faker.datatype.uuid();
      sendStub = mockSend({} as CopyObjectCommandOutput);
      await adapter.rename(fromKey, toKey);

      sinon.assert.calledTwice(sendStub); // copy and delete
      const deleteSendCall = sendStub.getCalls()[1];
      expect(
        deleteSendCall.args[0] instanceof DeleteObjectCommand
      ).toBeTruthy();
      const command = deleteSendCall.args[0] as DeleteObjectCommand;
      expect(command.input.Bucket).toBe(fakeBucketName);
      expect(command.input.Key).toBe(fromKey);
    });
  });

  describe(`writeFile`, () => {
    it(`should invoke send passing PutObjectCommand instance with the right parameters`, async () => {
      sendStub = mockSend({
        ETag: faker.datatype.uuid(),
        $metadata: {
          label: faker.lorem.word()
        },
        VersionId: faker.datatype.uuid(),
        Expiration: faker.datatype.datetime().toDateString(),
        ServerSideEncryption: `AES256`
      } as PutObjectCommandOutput);
      const key = faker.datatype.uuid();
      const content = faker.lorem.paragraph();

      await adapter.writeFile(key, content);

      sinon.assert.calledOnce(sendStub);
      const sendCall = sendStub.getCalls()[0];
      expect(sendCall.args[0] instanceof PutObjectCommand).toBeTruthy();
      const command = sendCall.args[0] as PutObjectCommand;
      expect(command.input.Bucket).toBe(fakeBucketName);
      expect(command.input.Key).toBe(key);
      expect(command.input.Body).toBe(content);
    });

    it(`should return the created object data`, async () => {
      const expectedOutput = {
        ETag: faker.datatype.uuid(),
        $metadata: {
          label: faker.lorem.word()
        },
        VersionId: faker.datatype.uuid(),
        Expiration: faker.datatype.datetime().toDateString(),
        ServerSideEncryption: `AES256`
      } as PutObjectCommandOutput;
      sendStub = mockSend(expectedOutput);
      const key = faker.datatype.uuid();
      const content = faker.lorem.paragraph();

      const actualOutput = await adapter.writeFile(key, content);

      expect(JSON.stringify(actualOutput)).toBe(JSON.stringify(expectedOutput));
    });
  });

  describe(`deleteFile`, () => {
    it(`should invoke send passing DeleteObjectCommand instance with the right parameters`, async () => {
      sendStub = mockSend({} as DeleteObjectCommandOutput);
      const key = faker.datatype.uuid();
      await adapter.deleteFile(key);

      sinon.assert.calledOnce(sendStub);
      const sendCall = sendStub.getCalls()[0];
      expect(sendCall.args[0] instanceof DeleteObjectCommand).toBeTruthy();
      const command = sendCall.args[0] as DeleteObjectCommand;
      expect(command.input.Key).toBe(key);
      expect(command.input.Bucket).toBe(fakeBucketName);
    });
  });

  describe(`deleteFiles`, () => {
    it(`should invoke send passing DeleteObjectsCommand instance with the right parameters`, async () => {
      sendStub = mockSend({} as DeleteObjectsCommandOutput);
      const keys = [faker.datatype.uuid(), faker.datatype.uuid()];

      await adapter.deleteFiles(keys);

      sinon.assert.calledOnce(sendStub);
      const sendCall = sendStub.getCalls()[0];
      expect(sendCall.args[0] instanceof DeleteObjectsCommand).toBeTruthy();
      const command = sendCall.args[0] as DeleteObjectsCommand;
      expect(command.input.Bucket).toBe(fakeBucketName);
      expect(command.input.Delete?.Objects?.length).toBe(2);
      expect(JSON.stringify(command.input.Delete?.Objects)).toBe(
        JSON.stringify(
          keys.map((key) => ({
            Key: key
          }))
        )
      );
    });
  });

  describe(`exists`, () => {
    it(`should invoke send passing HeadObjectCommand instance with the right parameters`, async () => {
      sendStub = mockSend({
        VersionId: faker.datatype.uuid()
      } as HeadObjectCommandOutput);
      const key = faker.datatype.uuid();

      await adapter.exists(key);

      sinon.assert.calledOnce(sendStub);
      const sendCall = sendStub.getCalls()[0];
      expect(sendCall.args[0] instanceof HeadObjectCommand).toBeTruthy();
      const command = sendCall.args[0] as HeadObjectCommand;
      expect(command.input.Bucket).toBe(fakeBucketName);
      expect(command.input.Key).toBe(key);
    });

    it(`should return true when the object exists`, async () => {
      sendStub = mockSend({
        VersionId: faker.datatype.uuid()
      } as HeadObjectCommandOutput);
      const key = faker.datatype.uuid();

      expect(await adapter.exists(key)).toBeTruthy();
    });

    it(`should return false when the error is NotFound`, async () => {
      const expectedError = new Error(`Object does not exist`);
      expectedError.name = `NotFound`;
      sendStub = sinon
        .stub(adapter.getS3Client(), `send`)
        .throws(expectedError);

      expect(await adapter.exists(faker.datatype.uuid())).toBeFalsy();
    });

    it(`should throw error when the error is not NotFound`, async () => {
      const expectedError = new Error(`Something went wrong!`);
      expectedError.name = `UnknownError`;
      sendStub = sinon
        .stub(adapter.getS3Client(), `send`)
        .throws(expectedError);

      await expect(adapter.exists(faker.datatype.uuid())).rejects.toThrow(
        expectedError.message
      );
    });
  });

  describe(`readDir`, () => {
    it(`should invoke send passing ListObjectsV2Command instance with the right parameters`, async () => {
      sendStub = mockSend({
        Contents: [
          {
            Key: faker.datatype.uuid()
          }
        ]
      } as ListObjectsV2CommandOutput);
      const prefix = faker.datatype.uuid();

      await adapter.readDir(prefix);

      sinon.assert.calledOnce(sendStub);
      const sendCall = sendStub.getCalls()[0];
      expect(sendCall.args[0] instanceof ListObjectsV2Command).toBeTruthy();
      const command = sendCall.args[0] as ListObjectsV2Command;
      expect(command.input.Bucket).toBe(fakeBucketName);
      expect(command.input.Prefix).toBe(prefix);
    });

    it(`should return the list of keys ignoring the empty keys`, async () => {
      const expectedKeys = [
        faker.datatype.uuid(),
        faker.datatype.uuid(),
        faker.datatype.uuid()
      ];

      sendStub = mockSend({
        Contents: expectedKeys
          .map((key) => ({
            Key: key
          }))
          .concat([
            {
              Key: `` // this will not be included in the result
            }
          ])
      } as ListObjectsV2CommandOutput);

      const result = await adapter.readDir(faker.datatype.uuid());

      expect(result.length).toBe(expectedKeys.length);
      result.every((key, index) => {
        expect(key).toBe(expectedKeys[index]);
      });
    });
  });

  describe(`mkdir`, () => {
    it(`should invoke send passing PutObjectCommand instance with the right parameters`, async () => {
      sendStub = mockSend({} as PutObjectCommandOutput);
      const key = `${faker.datatype.uuid()}/`;
      await adapter.mkdir(key);

      sinon.assert.calledOnce(sendStub);
      const sendCall = sendStub.getCalls()[0];
      expect(sendCall.args[0] instanceof PutObjectCommand).toBeTruthy();
      const command = sendCall.args[0] as PutObjectCommand;
      expect(command.input.Bucket).toBe(fakeBucketName);
      expect(command.input.Key).toBe(key);
      expect(command.input.Body).toBe(``);
    });

    it(`should add trailing slash when the key does not have it`, async () => {
      sendStub = mockSend({} as PutObjectCommandOutput);
      const key = faker.datatype.uuid();
      await adapter.mkdir(key);

      sinon.assert.calledOnce(sendStub);
      const sendCall = sendStub.getCalls()[0];
      const command = sendCall.args[0] as PutObjectCommand;
      expect(command.input.Key).toBe(`${key}/`);
    });
  });

  describe(`readFile`, () => {
    it(`should invoke send passing GetObjectCommand instance with the right parameters`, async () => {
      sendStub = mockSend({
        VersionId: faker.datatype.uuid(),
        Body: {
          transformToByteArray: async (): Promise<Uint8Array> =>
            Buffer.from('test content')
        }
      } as GetObjectCommandOutput);
      const key = faker.datatype.uuid();
      await adapter.readFile(key);

      sinon.assert.calledOnce(sendStub);
      const sendCall = sendStub.getCalls()[0];
      expect(sendCall.args[0] instanceof GetObjectCommand).toBeTruthy();
      const command = sendCall.args[0] as GetObjectCommand;
      expect(command.input.Key).toBe(key);
      expect(command.input.Bucket).toBe(fakeBucketName);
    });

    it(`should return the Buffer of the object's content`, async () => {
      sendStub = mockSend({
        VersionId: faker.datatype.uuid(),
        Body: {
          transformToByteArray: async (): Promise<Uint8Array> =>
            Buffer.from('test content')
        }
      } as GetObjectCommandOutput);
      const result = await adapter.readFile(faker.datatype.uuid());

      expect(result.toString()).toBe(`test content`);
    });

    it(`should throw error when the Body is undefined`, async () => {
      sendStub = mockSend({
        VersionId: faker.datatype.uuid(),
        Body: undefined
      } as GetObjectCommandOutput);

      await expect(adapter.readFile(faker.datatype.uuid())).rejects.toThrow(
        'Unable to read the content of the object.'
      );
    });

    it(`should throw error when transformToByteArray returns undefined`, async () => {
      sendStub = mockSend({
        VersionId: faker.datatype.uuid(),
        Body: {
          transformToByteArray: async (): Promise<Uint8Array | undefined> =>
            undefined
        }
      } as GetObjectCommandOutput);

      await expect(adapter.readFile(faker.datatype.uuid())).rejects.toThrow(
        'Unable to read the content of the object.'
      );
    });
  });

  describe(`rmdir`, () => {
    it(`should invoke send passing DeleteObjectCommand instance with the right parameters for when forceDelete is false/ undefined`, async () => {
      sendStub = mockSend({
        VersionId: faker.datatype.uuid()
      } as DeleteObjectCommandOutput);
      const key = `${faker.datatype.uuid()}/`;
      await adapter.rmdir(key);

      sinon.assert.calledOnce(sendStub);
      const sendCall = sendStub.getCalls()[0];
      expect(sendCall.args[0] instanceof DeleteObjectCommand).toBeTruthy();
      const command = sendCall.args[0] as DeleteObjectCommand;
      expect(command.input.Key).toBe(key);
      expect(command.input.Bucket).toBe(fakeBucketName);
    });

    it(`should add trailing slash when the key is missing it`, async () => {
      sendStub = mockSend({
        VersionId: faker.datatype.uuid()
      } as DeleteObjectCommandOutput);
      const key = faker.datatype.uuid();
      await adapter.rmdir(key);

      sinon.assert.calledOnce(sendStub);
      const sendCall = sendStub.getCalls()[0];
      const command = sendCall.args[0] as DeleteObjectCommand;
      expect(command.input.Key).toBe(`${key}/`);
    });

    it(`should recursively invoke send passing the correct command instances with the right parameters when the forceDelete is true`, async () => {
      const { firstListKeys, secondListKeys, thirdListKeys } = mockSendCalls();

      const prefix = `${faker.datatype.uuid()}/`;
      await adapter.rmdir(prefix, true);
      const sendCalls = sendStub.getCalls();
      expect(sendCalls.length).toBe(6);
      const call1 = sendCalls[0];
      expect(call1.args[0] instanceof ListObjectsV2Command).toBeTruthy();
      let listCommand: ListObjectsV2Command = call1.args[0];
      expect(listCommand.input.Bucket).toBe(fakeBucketName);
      expect(listCommand.input.Prefix).toBe(prefix);
      const call2 = sendCalls[1];
      expect(call2.args[0] instanceof DeleteObjectsCommand).toBeTruthy();
      let deleteCommand: DeleteObjectsCommand = call2.args[0];
      expect(deleteCommand.input.Bucket).toBe(fakeBucketName);
      expect(JSON.stringify(deleteCommand.input.Delete?.Objects)).toBe(
        JSON.stringify(firstListKeys.map((key) => ({ Key: key })))
      );
      const call3 = sendCalls[2];
      expect(call3.args[0] instanceof ListObjectsV2Command).toBeTruthy();
      listCommand = call3.args[0];
      expect(listCommand.input.Bucket).toBe(fakeBucketName);
      expect(listCommand.input.Prefix).toBe(prefix);
      const call4 = sendCalls[3];
      expect(call4.args[0] instanceof DeleteObjectsCommand).toBeTruthy();
      deleteCommand = call4.args[0];
      expect(deleteCommand.input.Bucket).toBe(fakeBucketName);
      expect(JSON.stringify(deleteCommand.input.Delete?.Objects)).toBe(
        JSON.stringify(secondListKeys.map((key) => ({ Key: key })))
      );
      const call5 = sendCalls[4];
      expect(call5.args[0] instanceof ListObjectsV2Command).toBeTruthy();
      listCommand = call5.args[0];
      expect(listCommand.input.Bucket).toBe(fakeBucketName);
      expect(listCommand.input.Prefix).toBe(prefix);
      const call6 = sendCalls[5];
      expect(call6.args[0] instanceof DeleteObjectsCommand).toBeTruthy();
      deleteCommand = call6.args[0];
      expect(JSON.stringify(deleteCommand.input.Delete?.Objects)).toBe(
        JSON.stringify(thirdListKeys.map((key) => ({ Key: key })))
      );
    });

    it(`should add trailing slash to the prefix when it does not have it`, async () => {
      mockSendCalls();

      const prefix = faker.datatype.uuid();
      await adapter.rmdir(prefix, true);
      const sendCalls = sendStub.getCalls();
      const call1 = sendCalls[0];
      let listCommand: ListObjectsV2Command = call1.args[0];
      expect(listCommand.input.Prefix).toBe(`${prefix}/`);
    });

    const mockSendCalls = () => {
      const firstListKeys = [
        faker.datatype.uuid(),
        faker.datatype.uuid(),
        faker.datatype.uuid()
      ];
      const secondListKeys = [
        faker.datatype.uuid(),
        faker.datatype.uuid(),
        faker.datatype.uuid()
      ];
      const thirdListKeys = [faker.datatype.uuid(), faker.datatype.uuid()];
      const listFirstListOutput = {
        $metadata: {},
        Contents: firstListKeys.map((key) => ({ Key: key })),
        IsTruncated: true
      } as ListObjectsV2CommandOutput;
      const listSecondOutput = {
        $metadata: {},
        Contents: secondListKeys.map((key) => ({ Key: key })),
        IsTruncated: true
      };
      const listThirdOutput = {
        $metadata: {},
        Contents: thirdListKeys.map((key) => ({ Key: key })),
        IsTruncated: false
      };

      sendStub = sinon.stub(adapter.getS3Client(), `send`);
      // list will be called first.
      sendStub.onCall(0).returns(listFirstListOutput);
      sendStub.onCall(1).returns({} as DeleteObjectsCommandOutput);
      sendStub.onCall(2).returns(listSecondOutput);
      sendStub.onCall(3).returns({} as DeleteObjectsCommandOutput);
      sendStub.onCall(4).returns(listThirdOutput);
      sendStub.onCall(5).returns({} as DeleteObjectsCommandOutput);

      return {
        firstListKeys,
        secondListKeys,
        thirdListKeys
      };
    };
  });

  describe(`isFile`, () => {
    it(`should return true when it can read head object and key does not have trailing slash`, async () => {
      sendStub = mockSend({
        VersionId: faker.datatype.uuid()
      } as HeadObjectCommandOutput);

      expect(await adapter.isFile(faker.datatype.uuid())).toBeTruthy();
    });

    it(`should return false when it can read head object but key has trailing slash`, async () => {
      sendStub = mockSend({
        VersionId: faker.datatype.uuid()
      } as HeadObjectCommandOutput);

      expect(await adapter.isFile(`${faker.datatype.uuid()}/`)).toBeFalsy();
    });

    it(`should invoke the first read head object call with the right parameters`, async () => {
      sendStub = mockSend({
        VersionId: faker.datatype.uuid()
      } as HeadObjectCommandOutput);

      const key = faker.datatype.uuid();
      await adapter.isFile(key);
      sinon.assert.calledOnce(sendStub);
      const firstCall = sendStub.getCalls()[0];
      expect(firstCall.args[0] instanceof HeadObjectCommand).toBeTruthy();
      const command = firstCall.args[0] as HeadObjectCommand;
      expect(command.input.Key).toBe(key);
      expect(command.input.Bucket).toBe(fakeBucketName);
    });

    it(`should invoke the second read head object call with the right parameters`, async () => {
      const notFoundError = new Error(`Object does not exist`);
      notFoundError.name = `NotFound`;
      sendStub = sinon.stub(adapter.getS3Client(), `send`);
      sendStub.onFirstCall().throws(notFoundError);
      sendStub.onSecondCall().returns({
        VersionId: faker.datatype.uuid()
      } as HeadObjectCommandOutput);
      const key = faker.datatype.uuid();
      await adapter.isFile(key);
      sinon.assert.calledTwice(sendStub);
      const secondCall = sendStub.getCalls()[1];
      expect(secondCall.args[0] instanceof HeadObjectCommand).toBeTruthy();
      const command = secondCall.args[0] as HeadObjectCommand;
      expect(command.input.Key).toBe(`${key}/`);
      expect(command.input.Bucket).toBe(fakeBucketName);
    });

    it(`should return false when it throws NotFound error reading head object but it can read in the second and key does not have trailing slash`, async () => {
      const notFoundError = new Error(`Object does not exist`);
      notFoundError.name = `NotFound`;
      sendStub = sinon.stub(adapter.getS3Client(), `send`);
      sendStub.onFirstCall().throws(notFoundError);
      sendStub.onSecondCall().returns({
        VersionId: faker.datatype.uuid()
      } as HeadObjectCommandOutput);

      expect(await adapter.isFile(faker.datatype.uuid())).toBeFalsy();
    });

    it(`should throw error when the error is not NotFound`, async () => {
      const unknownError = new Error(`Something went wrong.`);
      unknownError.name = `Unknown`;
      sendStub = sinon.stub(adapter.getS3Client(), `send`);
      sendStub.throws(unknownError);

      await expect(adapter.isFile(faker.datatype.uuid())).rejects.toThrow(
        unknownError.message
      );
    });

    it(`should throw error when it cannot read head object in the second round`, async () => {
      const notFoundError = new Error(`Object does not exist`);
      notFoundError.name = `NotFound`;
      const unknownError = new Error(`Something went wrong.`);
      unknownError.name = `Unknown`;
      sendStub = sinon.stub(adapter.getS3Client(), `send`);
      sendStub.onFirstCall().throws(notFoundError);
      sendStub.onSecondCall().throws(unknownError);

      await expect(adapter.isFile(faker.datatype.uuid())).rejects.toThrow(
        unknownError.message
      );
    });
  });

  describe(`isDir`, () => {
    it(`should return true when reading head object is successful`, async () => {
      sendStub = mockSend({
        VersionId: faker.datatype.uuid()
      } as HeadObjectCommandOutput);

      expect(await adapter.isDir(`${faker.datatype.uuid()}/`)).toBeTruthy();
    });

    it(`should add trailing slash to the key when it does not have it`, async () => {
      sendStub = mockSend({
        VersionId: faker.datatype.uuid()
      } as HeadObjectCommandOutput);
      const key = faker.datatype.uuid();

      await adapter.isDir(key);

      sinon.assert.calledOnce(sendStub);
      const command = sendStub.getCalls()[0].args[0] as HeadObjectCommand;
      expect(command.input.Key).toBe(`${key}/`);
    });

    it(`should invoke the first read head object calls with the right parameters`, async () => {
      sendStub = mockSend({
        VersionId: faker.datatype.uuid()
      } as HeadObjectCommandOutput);
      const key = `${faker.datatype.uuid()}/`;

      await adapter.isDir(key);

      sinon.assert.calledOnce(sendStub);
      const sendCall = sendStub.getCalls()[0];
      expect(sendCall.args[0] instanceof HeadObjectCommand).toBeTruthy();
      const command = sendCall.args[0] as HeadObjectCommand;
      expect(command.input.Key).toBe(key);
      expect(command.input.Bucket).toBe(fakeBucketName);
    });

    it(`should return false when first read head object call throws NotFound error but second call is successful without trailing slash`, async () => {
      const notFoundError = new Error(`Object does not exist`);
      notFoundError.name = `NotFound`;
      sendStub = sinon.stub(adapter.getS3Client(), `send`);
      sendStub.onFirstCall().throws(notFoundError);
      sendStub.onSecondCall().returns({
        VersionId: faker.datatype.uuid()
      } as HeadObjectCommandOutput);

      expect(await adapter.isDir(faker.datatype.uuid())).toBeFalsy();
    });

    it(`should invoke second read head object call with the right parameters`, async () => {
      const notFoundError = new Error(`Object does not exist`);
      notFoundError.name = `NotFound`;
      sendStub = sinon.stub(adapter.getS3Client(), `send`);
      sendStub.onFirstCall().throws(notFoundError);
      sendStub.onSecondCall().returns({
        VersionId: faker.datatype.uuid()
      } as HeadObjectCommandOutput);

      const keyWithoutTrailingSlash = faker.datatype.uuid();
      const keyWithTrailingSlash = `${keyWithoutTrailingSlash}/`;
      await adapter.isDir(keyWithTrailingSlash);

      sinon.assert.calledTwice(sendStub);
      const secondCall = sendStub.getCalls()[1];
      expect(secondCall.args[0] instanceof HeadObjectCommand).toBeTruthy();
      const command = secondCall.args[0] as HeadObjectCommand;
      expect(command.input.Bucket).toBe(fakeBucketName);
      expect(command.input.Key).toBe(keyWithoutTrailingSlash);
    });

    it(`should throw error when error thrown by the first read head object call is not NotFound`, async () => {
      const unknownError = new Error(`Something went wrong.`);
      unknownError.name = `Unknown`;
      sendStub = sinon.stub(adapter.getS3Client(), `send`).throws(unknownError);

      await expect(adapter.isDir(faker.datatype.uuid())).rejects.toThrow(
        unknownError.message
      );
    });
  });

  const mockGetAwsS3Bucket = (): SinonStub =>
    sinon.stub(utilities, `getAwsS3Bucket`).returns(fakeBucketName);

  const mockSend = (response: unknown): SinonStub => {
    const subjectFunc = sinon.stub(adapter.getS3Client(), `send`);
    return subjectFunc.callsFake(
      jest.fn(() => {
        return Promise.resolve(response);
      })
    );
  };
});
