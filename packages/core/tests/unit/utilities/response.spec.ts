import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { faker } from '@faker-js/faker';
import { successResponse } from '../../../src/utilities/response';

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

      expect((resMock.status as jest.Mock).mock.calls.length).toBe(1);
      const statusCall = (resMock.status as jest.Mock).mock.calls[0];
      expect(statusCall[0]).toBe(StatusCodes.OK);
      expect((resMock.json as jest.Mock).mock.calls.length).toBe(1);
      const jsonCall = (resMock.json as jest.Mock).mock.calls[0];
      expect(JSON.stringify(jsonCall[0])).toBe(
        JSON.stringify({
          data
        })
      );
    });
  });

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
