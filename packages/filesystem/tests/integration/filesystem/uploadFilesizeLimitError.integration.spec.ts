import express from 'express';
import sinon from 'sinon';
import { ErrorCodes, setServerDirectory } from '@men-mvc/foundation';
import { configureTestRoutes } from '../testRoutes';
import {
  generateSimpleFormDataPayload,
  makeFormDataRequest
} from './utilities';
import * as utilities from '../../../src/utilities/utilities';
import { registerMultipartFormParser } from '../../../src';

describe('FileSystem - UploadFilesizeLimit', function () {
  beforeAll(() => {
    setServerDirectory(process.cwd());
  });

  afterAll(() => {
    setServerDirectory('');
  });

  // TODO: figure out why uploaded file sie is sometimes 1 and sometimes 2
  it(`should throw max upload filesize limit error when the file is too large`, async () => {
    let getMaxUploadLimitStub = fakeGetMaxUploadLimit(2);
    setUpApplication();
    const { body } = await makeFormDataRequest(generateSimpleFormDataPayload());

    expect(body.error.name).toBe(ErrorCodes.UPLOAD_MAX_FILESIZE_LIMIT);
    getMaxUploadLimitStub.restore();
  });

  const setUpApplication = () => {
    const testApplication = require(`../testApplication`);
    const exApp: express.Express = express();
    let application = new testApplication.TestApplication(exApp);
    exApp.use(express.urlencoded({ extended: true }));
    exApp.use(express.json());
    registerMultipartFormParser(exApp);
    configureTestRoutes(application);
  };

  const fakeGetMaxUploadLimit = (maxLimit: number): sinon.SinonStub => {
    let getMaxUploadLimitStub = sinon.stub(utilities, `getUploadFilesizeLimit`);
    const fakeGetUploadFilesizeLimit = jest
      .fn()
      .mockImplementation(() => maxLimit);
    getMaxUploadLimitStub.callsFake(fakeGetUploadFilesizeLimit);

    return getMaxUploadLimitStub;
  };
});
