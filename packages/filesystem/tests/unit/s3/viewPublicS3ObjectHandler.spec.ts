import { Request, Response } from 'express';
import sinon, { SinonSandbox, SinonStub } from 'sinon';
import { FileSystemDriver } from '@men-mvc/config';
import { faker } from '@faker-js/faker';
import { ReadStream } from 'fs';
import { viewPublicS3ObjectRequestHandler } from '../../../src/s3/viewPublicS3ObjectHandler';
import * as utilities from '../../../src/utilities/utilities';
import * as foundation from '../../../src/foundation';
import { FileSystem, getPublicStorageDirname } from '../../../src';

describe(`viewPublicS3ObjectHandler`, () => {
  const fileContent = faker.datatype.uuid();
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
    FileSystem.resetInstance();
  });

  it(`should throw error when the driver is not s3`, async () => {
    sandbox.stub(utilities, `getDriver`).returns(FileSystemDriver.local);
    await expect(
      viewPublicS3ObjectRequestHandler({} as Request, {} as Response)
    ).rejects.toThrow(`Filesystem is not using S3 driver.`);
  });

  it(`should return not found when key param is missing`, async () => {
    sandbox.stub(utilities, `getDriver`).returns(FileSystemDriver.s3);
    const notFoundResponseStub = sandbox.stub(foundation, `notFoundResponse`);
    await viewPublicS3ObjectRequestHandler(
      { params: {} } as Request,
      { statusCode: 404 } as Response
    );
    sinon.assert.calledOnceWithExactly(
      notFoundResponseStub,
      { statusCode: 404 } as Response,
      `Key is missing.`
    );
  });

  it(`should throw FileNotPublicError when the file is not a public file`, async () => {
    sandbox.stub(utilities, `getDriver`).returns(FileSystemDriver.s3);
    await expect(
      viewPublicS3ObjectRequestHandler(
        { params: { key: faker.system.filePath() } } as unknown as Request,
        {} as Response
      )
    ).rejects.toThrow(`File is not public.`);
  });

  /**
   * ! also assert that createReadStream is called and the pipe is applied on the result of createReadStream
   */
  it(`should return file stream content`, async () => {
    sandbox.stub(utilities, `getDriver`).returns(FileSystemDriver.s3);
    const key = `${getPublicStorageDirname()}/${faker.datatype.uuid()}.png`;
    const createReadStreamStub = stubCreateReadStream();

    const result = await viewPublicS3ObjectRequestHandler(
      { params: { key } } as unknown as Request,
      { contentType: (mime: string) => {} } as Response
    );

    sinon.assert.calledOnceWithExactly(createReadStreamStub, key);
    expect(result).toBe(fileContent);
  });

  it(`should decode the key param`, async () => {
    sandbox.stub(utilities, `getDriver`).returns(FileSystemDriver.s3);
    const key = `${getPublicStorageDirname()}/${faker.datatype.uuid()}.png`;
    const encodedKey = encodeURIComponent(key);
    const createReadStreamStub = stubCreateReadStream();

    await viewPublicS3ObjectRequestHandler(
      { params: { key: encodedKey } } as unknown as Request,
      { contentType: (mime: string) => {} } as Response
    );

    sinon.assert.calledOnceWithExactly(
      createReadStreamStub,
      decodeURIComponent(key)
    );
  });

  it(`should set mime type when there's mime type for filepath`, async () => {
    sandbox.stub(utilities, `getDriver`).returns(FileSystemDriver.s3);
    const key = `${getPublicStorageDirname()}/${faker.datatype.uuid()}.png`;
    stubCreateReadStream();
    let contentSet = false;

    await viewPublicS3ObjectRequestHandler(
      { params: { key: encodeURIComponent(key) } } as unknown as Request,
      {
        contentType: (mime: string) => {
          contentSet = true;
        }
      } as Response
    );

    expect(contentSet).toBeTruthy();
  });

  it(`should not set content type when there's no mime type for the file`, async () => {
    sandbox.stub(utilities, `getDriver`).returns(FileSystemDriver.s3);
    const key = `${getPublicStorageDirname()}/${faker.datatype.uuid()}`;
    stubCreateReadStream();
    let contentSet = false;

    await viewPublicS3ObjectRequestHandler(
      { params: { key: encodeURIComponent(key) } } as unknown as Request,
      {
        contentType: (mime: string) => {
          contentSet = true;
        }
      } as Response
    );

    expect(contentSet).toBeFalsy();
  });

  const stubCreateReadStream = (): SinonStub => {
    return sandbox.stub(FileSystem.getInstance(), `createReadStream`).returns(
      Promise.resolve({
        pipe: (res: unknown) => {
          return fileContent;
        }
      } as unknown as ReadStream)
    );
  };
});
