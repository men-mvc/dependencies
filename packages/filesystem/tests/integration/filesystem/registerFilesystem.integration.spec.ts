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

const serverDirectoryBeforeTests = getServerDirectory();
describe(`registerFilesystem middleware`, () => {
  let sandbox: SinonSandbox;
  beforeAll(() => {
    sandbox = createSandbox();
    sandbox.stub(utilities, `getDriver`).returns(FileSystemDriver.s3);
    setServerDirectory(process.cwd());
  });

  afterAll(() => {
    setServerDirectory(serverDirectoryBeforeTests);
    sandbox.restore();
  });

  it(`should register route to view public s3 object`, async () => {
    const { status } = await makeViewPublicS3ObjectRequest(
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
});
