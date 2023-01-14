import { Request, Response } from 'express';
import { requestHandler } from '../../../src/utilities/request';

describe(`Request Utility`, () => {
  describe(`requestHandler`, () => {
    it(`should call next with error when function throws error`, () => {
      try {
        const wrapperFuncResult = requestHandler((req, res, next) => {
          throw new Error(`Something went wrong!`);
        });
        const nextFunc = jest.fn().mockImplementation((err) => {
          if (err) {
            throw err;
          }
        });
        const handlerResult = wrapperFuncResult(
          {} as Request,
          {} as Response,
          nextFunc
        );
        expect(handlerResult).toBeUndefined();
        throw new Error(`Excepted error was not thrown`);
      } catch (e) {
        expect(
          e instanceof Error && e.message === 'Something went wrong!'
        ).toBeTruthy();
      }
    });

    it(`should not invoke next when function does not throw error`, () => {
      const mockHandlerFunc = jest
        .fn()
        .mockImplementation((req, res, next) => {});
      const wrapperFuncResult = requestHandler(mockHandlerFunc);
      const nextFunc = jest.fn().mockImplementation((err) => {
        if (err) {
          throw err;
        }
      });
      const handlerFuncResult = wrapperFuncResult(
        {} as Request,
        {} as Response,
        nextFunc
      );
      expect(handlerFuncResult).toBeUndefined();
      expect(mockHandlerFunc.mock.calls.length).toBe(1);
    });
  });
});
