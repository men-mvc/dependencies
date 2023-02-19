import { Response } from 'express';
import { faker } from '@faker-js/faker';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  emptyResponse,
  validationErrorResponse,
  unauthorisedErrorResponse,
  insufficientPermissionsResponse
} from '../../../src/utilities/response';
import { ValidationError } from '../../../src/types/validationError';
import { ErrorCodes, InsufficientPermissionError, StatusCodes } from '../../../src/types';

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

  describe(`notFoundResponse`, () => {
    it(`should return data in the correct structure with 404 status code`, () => {
      const resMock = mockExpressResponse();
      notFoundResponse(resMock, `User not found.`);
      assertResponseStatus(resMock, StatusCodes.NOT_FOUND);
      assertResponseJson(resMock, {
        error: {
          message: `User not found.`
        }
      });
    });
  });

  describe(`emptyResponse`, () => {
    it(`should return empty data with 204 status code`, () => {
      const resMock = mockExpressResponse();
      emptyResponse(resMock);
      assertResponseStatus(resMock, StatusCodes.NO_CONTENT);
      assertResponseJson(resMock, null);
    });
  });

  describe(`validationErrorResponse`, () => {
    it(`should return errors in correct structure with 422 status code`, () => {
      const errors = {
        name: `Name is required.`,
        email: `Email is required.`
      };
      const validationError = new ValidationError(errors);
      const resMock = mockExpressResponse();
      validationErrorResponse(resMock, validationError);
      assertResponseStatus(resMock, StatusCodes.UNPROCESSABLE_ENTITY);
      assertResponseJson(resMock, {
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: `Validation failed.`,
          details: errors
        }
      });
    });
  });

  describe(`unauthorisedErrorResponse`, () => {
    it(`should return default message with 401 status code when message is not provided`, () => {
      const resMock = mockExpressResponse();
      unauthorisedErrorResponse(resMock);
      assertResponseStatus(resMock, StatusCodes.UNAUTHORIZED);
      assertResponseJson(resMock, {
        error: {
          message: `Unauthorised.`
        }
      });
    });

    it(`should return provided message with 401 status code`, () => {
      const resMock = mockExpressResponse();
      unauthorisedErrorResponse(resMock, `Credentials are invalid.`);
      assertResponseStatus(resMock, StatusCodes.UNAUTHORIZED);
      assertResponseJson(resMock, {
        error: {
          message: `Credentials are invalid.`
        }
      });
    });
  });

  describe(`insufficientPermissionsResponse`, () => {
    it(`should return response data in correct structure with 403 status code`, () => {
      const resMock = mockExpressResponse();
      insufficientPermissionsResponse(
        resMock,
        new InsufficientPermissionError()
      );
      assertResponseStatus(resMock, StatusCodes.FORBIDDEN);
      assertResponseJson(resMock, {
        error: {
          message: `Insufficient permissions.`,
          code: ErrorCodes.INSUFFICIENT_PERMISSIONS
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
