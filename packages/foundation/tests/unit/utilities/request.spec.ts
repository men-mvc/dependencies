import { Request, Response } from 'express';
import {faker} from "@faker-js/faker";
import { requestHandler, asyncRequestHandler, extractBearerToken } from '../../../src';

describe(`Request Utility`, () => {
  describe(`extractBearerToken`, () => {
    it(`should return null when Authorization header is empty`, () => {
      const req = {
        header: (header) => ``
      } as Request;

      const token = extractBearerToken(req);
      expect(token).toBeNull();
    });

    it(`should return null when Authorization header value has more than two segments`, () => {
      const req = {
        header: (header) =>
            `Bearer ${faker.datatype.uuid()} ${faker.datatype.uuid()}`
      } as Request;

      const token = extractBearerToken(req);
      expect(token).toBeNull();
    });

    it(`should return null when Authorization header value has less than two segments`, () => {
      const req = {
        header: (header) => `Bearer`
      } as Request;

      const token = extractBearerToken(req);
      expect(token).toBeNull();
    });

    it(`should return null when the first segment iof the Authorization header value is not Bearer`, () => {
      const req = {
        header: (header) => `Bxarer`
      } as Request;

      const token = extractBearerToken(req);
      expect(token).toBeNull();
    });

    it(`should return the token`, () => {
      const fakeToken = faker.datatype.uuid();
      const req = {
        header: (header) => `Bearer ${fakeToken}`
      } as Request;

      const token = extractBearerToken(req);
      expect(token).toBe(fakeToken);
    });
  });

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
