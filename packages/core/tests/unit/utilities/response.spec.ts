import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { faker } from '@faker-js/faker';
import {
  successResponse,
  errorResponse
} from '../../../src/utilities/response';

class FakeExpressResponse {
  status = (status: number) => {
    return this;
  };
  json = (data: object | string | number) => {};
}
describe(`Response Utility`, () => {
  describe(`successResponse`, () => {
    it(`should return response in the correct structure with 200 status code`, () => {
      const resMock = mockExpressResponse();
      const data = {
        id: faker.datatype.uuid(),
        name: faker.name.fullName()
      };
      successResponse(resMock, data);

      assertResponseStatus(resMock, StatusCodes.OK);
      assertResponseJson(resMock, {
        data
      });
    });
  });

  describe(`errorResponse`, () => {
    it(`should return response in the correct structure`, () => {
      const resMock = mockExpressResponse();
      const error = {
        message: faker.lorem.sentence(4),
        code: `UnknownException`,
        details: {
          requestId: faker.datatype.uuid(),
          traceId: faker.datatype.uuid()
        }
      };
      errorResponse(resMock, error, StatusCodes.INTERNAL_SERVER_ERROR);
      assertResponseStatus(resMock, StatusCodes.INTERNAL_SERVER_ERROR);
      assertResponseJson(resMock, {
        error
      });
    });

    it(`should return error message string in the correct structure`, () => {
      const resMock = mockExpressResponse();
      errorResponse(resMock, `Unauthorised`, StatusCodes.UNAUTHORIZED);
      assertResponseStatus(resMock, StatusCodes.UNAUTHORIZED);
      assertResponseJson(resMock, {
        error: {
          message: `Unauthorised`
        }
      });
    });
  });

  const assertResponseStatus = (
    resMock: Response,
    expectedStatusCode: number
  ) => {
    expect((resMock.status as jest.Mock).mock.calls.length).toBe(1);
    const statusCall = (resMock.status as jest.Mock).mock.calls[0];
    expect(statusCall[0]).toBe(expectedStatusCode);
  };

  const assertResponseJson = <T>(
    resMock: Response,
    expectedResponseData: T
  ) => {
    expect((resMock.json as jest.Mock).mock.calls.length).toBe(1);
    const jsonCall = (resMock.json as jest.Mock).mock.calls[0];
    expect(JSON.stringify(jsonCall[0])).toBe(
      JSON.stringify(expectedResponseData)
    );
  };

  const mockExpressResponse = (): Response => {
    const jsonMockFunc = jest.fn().mockImplementation((data) => data);
    const statusMockFunc = jest.fn().mockImplementation((code: number) => {
      return {
        json: jsonMockFunc
      };
    });

    const response: FakeExpressResponse = {
      status: statusMockFunc,
      json: jsonMockFunc
    };

    return response as Response;
  };
});
