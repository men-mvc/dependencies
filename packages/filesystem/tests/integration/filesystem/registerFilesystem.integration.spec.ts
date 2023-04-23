import supertest from 'supertest';
import { faker } from '@faker-js/faker';
import {
  FileSystemDriver,
  getServerDirectory,
  replaceRouteParams,
  setServerDirectory,
  StatusCodes
} from '@men-mvc/foundation';
import { createSandbox, SinonSandbox } from 'sinon';
import { getTestExpressApp } from '../utilities';
import * as utilities from '../../../src/utilities/utilities';
import { viewPublicS3ObjectRoute } from '../../../src/s3/viewPublicS3ObjectHandler';
import { viewLocalSignedUrlRoute } from '../../../src/localFileSignedUrlHandler';

const serverDirectoryBeforeTests = getServerDirectory();
describe(`registerFilesystem middleware`, () => {
  let sandbox: SinonSandbox;
  beforeAll(() => {
    setServerDirectory(process.cwd());
  });

  afterAll(() => {
    setServerDirectory(serverDirectoryBeforeTests);
  });

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it(`should register route to view public s3 object`, async () => {
    sandbox.stub(utilities, `getDriver`).returns(FileSystemDriver.s3);
    const { status } = await makeViewPublicS3ObjectRequest(
      faker.datatype.uuid()
    );
    expect(status).not.toBe(StatusCodes.NOT_FOUND);
  });

  it(`should register route to serve local signed url`, async () => {
    sandbox.stub(utilities, `getDriver`).returns(FileSystemDriver.local);
    const { status } = await makeViewLocalSignedUrlRequest(
      faker.datatype.uuid()
    );
    expect(status).not.toBe(StatusCodes.NOT_FOUND);
  });

  const makeViewPublicS3ObjectRequest = async (key: string) =>
    supertest(await getTestExpressApp())
      .get(
        replaceRouteParams(viewPublicS3ObjectRoute, {
          key: encodeURIComponent(key)
        })
      )
      .send({});

  const makeViewLocalSignedUrlRequest = async (filepath: string) =>
    supertest(await getTestExpressApp())
      .get(
        replaceRouteParams(viewLocalSignedUrlRoute, {
          filepath: encodeURIComponent(filepath)
        })
      )
      .send({});
});
