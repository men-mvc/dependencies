import { getServerDirectory, setServerDirectory } from '@men-mvc/essentials';
import path from 'path';
import sinon, { SinonSpy } from 'sinon';
import * as mockRequestErrorHandler from './mocks/errors/requestErrorHandler';
import { Request, Response } from 'express';
import {
  getApplicationErrorHandlerModulePath,
  invokeRequestErrorHandler
} from '../../../src';
import { requestErrorHandler } from './mocks/errors/requestErrorHandler';

const serverDirectoryBeforeTests = getServerDirectory();
const testServerDir = path.join(__dirname, 'mocks');
describe(`Error Utilities`, () => {
  beforeAll(() => {
    setServerDirectory(testServerDir);
  });

  afterAll(() => {
    setServerDirectory(serverDirectoryBeforeTests);
  });

  describe(`getApplicationErrorHandlerModulePath`, () => {
    it(`should return the server dir + error + requestErrorHandler without extension`, () => {
      expect(getApplicationErrorHandlerModulePath()).toBe(
        path.join(testServerDir, 'errors', 'requestErrorHandler')
      );
    });
  });

  describe(`invokeRequestErrorHandler`, () => {
    let requestErrorHandlerSpy: SinonSpy;
    beforeEach(() => {
      requestErrorHandlerSpy = sinon.spy(
        mockRequestErrorHandler,
        'requestErrorHandler'
      );
    });
    afterEach(() => {
      requestErrorHandlerSpy.restore();
    });

    it(`should invoke requestErrorHandler with passing the right parameters`, () => {
      const error = new Error('Something went wrong!');
      invokeRequestErrorHandler(
        error,
        {
          header: (field: string) => `testing`
        } as Request,
        {
          statusCode: 500
        } as Response
      );
      sinon.assert.calledOnce(requestErrorHandlerSpy);
      const callArgs = requestErrorHandlerSpy.getCalls()[0].args;
      expect((callArgs[0] as Error).message).toBe(error.message);
      expect((callArgs[1] as Request).header(`test`)).toBe(`testing`);
      expect((callArgs[2] as Response).statusCode).toBe(500);
    });

    it(`should return the correct response`, () => {
      const error = new Error('Something went wrong!');
      const res = invokeRequestErrorHandler(
        error,
        {} as Request,
        {} as Response
      );
      expect(res.statusCode).toBe(500);
    });
  });
});
