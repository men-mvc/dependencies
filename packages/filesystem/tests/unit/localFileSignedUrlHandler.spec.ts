import { Request, Response } from 'express';
import {
  FileSystemDriver,
  getServerDirectory,
  setServerDirectory,
  StatusCodes
} from '@men-mvc/foundation';
import { faker } from '@faker-js/faker';
import sinon, { SinonSandbox, SinonStub } from 'sinon';
import url from 'url';
import * as queryString from 'querystring';
import { localFileSignedUrlHandler } from '../../src/localFileSignedUrlHandler';
import * as foundation from '../../src/foundation';
import * as utilities from '../../src/utilities/utilities';
import { FileSystem, getPrivateStorageDirname, LocalStorage } from '../../src';
import {
  createNecessaryStorageDirectories,
  delay,
  deleteStorageDirectory
} from '../testUtilities';
import { ReadStream } from 'fs';

const fileContent = faker.datatype.uuid();
const localStorage = new LocalStorage();
const serverDirectoryBeforeTests = getServerDirectory();

describe(`localFileSignedUrlHandler`, () => {
  const appBaseUrl = faker.internet.url();
  let sandbox: SinonSandbox;

  beforeAll(() => {
    setServerDirectory(process.cwd());
    createNecessaryStorageDirectories();
  });

  afterAll(() => {
    setServerDirectory(serverDirectoryBeforeTests);
    deleteStorageDirectory();
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(foundation, `getAppBaseUrl`).returns(appBaseUrl);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it(`should return error response when filepath parameter is missing`, async () => {
    const res = { statusCode: StatusCodes.BAD_REQUEST } as Response;
    const errorResponseStub = sandbox.stub(foundation, `errorResponse`);
    await localFileSignedUrlHandler(
      {
        params: {}
      } as Request,
      res
    );

    sinon.assert.calledOnceWithExactly(
      errorResponseStub,
      res,
      `Filepath is missing.`,
      StatusCodes.BAD_REQUEST
    );
  });

  it(`should return error response when the link is expired`, async () => {
    const filepath = `${getPrivateStorageDirname()}/${faker.datatype.uuid()}.png`;
    const res = { statusCode: StatusCodes.BAD_REQUEST } as Response;
    localStorage.buildUrlToBeSigned(filepath);
    localStorage.getSignedUrl(filepath, 1);
    const errorResponseStub = sandbox.stub(foundation, `errorResponse`);

    await delay(2000);
    await localFileSignedUrlHandler(
      {
        params: {
          filepath
        }
      } as unknown as Request,
      res
    );

    sinon.assert.calledOnceWithExactly(
      errorResponseStub,
      res,
      `Link is no longer valid/ expired.`,
      StatusCodes.BAD_REQUEST
    );
  });

  it(`should return the stream of the file's content`, async () => {
    const createReadStreamStub = stubCreateReadStream();
    const filepath = `${getPrivateStorageDirname()}/${faker.datatype.uuid()}.png`;
    const res = {
      statusCode: StatusCodes.BAD_REQUEST,
      contentType: (mimeType: string) => {}
    } as Response;
    const signedUrl = localStorage.getSignedUrl(filepath, 300);
    const signedUrlParts = url.parse(signedUrl);
    const hash = queryString.parse(signedUrlParts.query as string).hash;

    const result = await localFileSignedUrlHandler(
      {
        params: {
          filepath: encodeURIComponent(filepath),
          hash
        }
      } as unknown as Request,
      res
    );

    expect(result).toBe(fileContent);
    sinon.assert.calledOnceWithExactly(createReadStreamStub, filepath);
  });

  it(`should set the right content type`, async () => {
    stubCreateReadStream();
    const filepath = `${getPrivateStorageDirname()}/${faker.datatype.uuid()}.png`;
    const res = {
      statusCode: StatusCodes.BAD_REQUEST,
      contentType: (mimeType: string) => {}
    } as Response;
    const contentTypeStub = sinon.stub(res, `contentType`);
    const signedUrl = localStorage.getSignedUrl(filepath, 300);
    const signedUrlParts = url.parse(signedUrl);
    const hash = queryString.parse(signedUrlParts.query as string).hash;

    await localFileSignedUrlHandler(
      {
        params: {
          filepath: encodeURIComponent(filepath),
          hash
        }
      } as unknown as Request,
      res
    );

    sinon.assert.calledOnceWithExactly(contentTypeStub, `image/png`);
  });

  it(`should not set the content type when it cannot find mime type for the file`, async () => {
    stubCreateReadStream();
    const filepath = `${getPrivateStorageDirname()}/${faker.datatype.uuid()}`;
    const res = {
      statusCode: StatusCodes.BAD_REQUEST,
      contentType: (mimeType: string) => {}
    } as Response;
    const contentTypeStub = sinon.stub(res, `contentType`);
    const signedUrl = localStorage.getSignedUrl(filepath, 300);
    const signedUrlParts = url.parse(signedUrl);
    const hash = queryString.parse(signedUrlParts.query as string).hash;

    await localFileSignedUrlHandler(
      {
        params: {
          filepath: encodeURIComponent(filepath),
          hash
        }
      } as unknown as Request,
      res
    );

    sinon.assert.notCalled(contentTypeStub);
  });

  it(`should throw error when the driver is not local`, async () => {
    sandbox.stub(utilities, `getDriver`).returns(FileSystemDriver.s3);
    await expect(
      localFileSignedUrlHandler(
        {
          params: {}
        } as Request,
        {} as Response
      )
    ).rejects.toThrow(`Filesystem is not using local driver.`);
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
