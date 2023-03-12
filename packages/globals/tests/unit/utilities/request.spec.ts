import { Request, Response } from 'express';
import {
  requestHandler,
  asyncRequestHandler,
} from '../../../src';

describe(`Request Utility`, () => {
  describe(`requestHandler`, () => {
    it(`should call next with error when handler function throws error`, () => {
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

    it(`should not invoke next when handler function does not throw error`, () => {
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

  describe(`asyncRequestHandler`, () => {
    it(`should call next with error when handler function throws error`, async () => {
      try {
        const wrapperFuncResult = asyncRequestHandler(
          async (req, res, next) => {
            throw new Error(`Something went wrong!`);
          }
        );
        const nextFunc = jest.fn().mockImplementation((err) => {
          if (err) {
            throw err;
          }
        });
        const handlerResult = await wrapperFuncResult(
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

    it(`should not invoke next when handler function does not throw error`, async () => {
      const mockHandlerFunc = jest
        .fn()
        .mockImplementation(async (req, res, next) => {});
      const wrapperFuncResult = asyncRequestHandler(mockHandlerFunc);
      const nextFunc = jest.fn().mockImplementation((err) => {
        if (err) {
          throw err;
        }
      });
      const handlerFuncResult = await wrapperFuncResult(
        {} as Request,
        {} as Response,
        nextFunc
      );
      expect(handlerFuncResult).toBeUndefined();
      expect(mockHandlerFunc.mock.calls.length).toBe(1);
    });
  });
});
