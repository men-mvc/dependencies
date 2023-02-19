import axios from 'axios';
import { faker } from '@faker-js/faker';
import { http, HttpResult } from '../src/http';
import {StatusCodes} from "../src";

/**
 * The tests are only making sure that the functions in the abstraction layer are calling the
 * right functions of the underlying library as we are trusting the underlying library
 */
type FakeResponseData = {
  message: string;
};
jest.mock(`axios`);
const mockAxios = axios as jest.Mocked<typeof axios>;
const url = `http://localhost`;
const token = faker.datatype.uuid();
const data = {
  name: faker.name.fullName()
};
const responseData: FakeResponseData = {
  message: `This is the mock data.`
};
describe(`Http Utility`, () => {
  afterAll(() => {
    jest.unmock('axios');
  });

  it(`should call axios get function passing the right parameters`, async () => {
    const mockGetFunc = jest.fn((url, config) =>
      Promise.resolve({
        data: responseData,
        status: StatusCodes.OK
      })
    );
    mockAxios.get.mockImplementation(mockGetFunc);
    const result = await http.get<FakeResponseData>(url, {
      Authorization: token
    });

    expect(result instanceof HttpResult).toBeTruthy();
    expect(result.status).toBe(StatusCodes.OK);
    expect(result.body.message).toBe(responseData.message);
    const parameters = mockGetFunc.mock.calls[0];
    expect(parameters[0]).toBe(url);
    expect(parameters[1].headers.Authorization).toBe(token);
  });

  it(`should call axis post function passing the right parameters`, async () => {
    const mockPostFunc = jest.fn((url, data, config) =>
      Promise.resolve({
        data: responseData,
        status: StatusCodes.OK
      })
    );
    mockAxios.post.mockImplementation(mockPostFunc);
    const result = await http.post<FakeResponseData>(url, data, {
      Authorization: token
    });

    expect(result instanceof HttpResult).toBeTruthy();
    expect(result.status).toBe(StatusCodes.OK);
    expect(result.body.message).toBe(responseData.message);
    const parameters = mockPostFunc.mock.calls[0];
    expect(parameters[0]).toBe(url);
    expect(parameters[1]).toBe(data);
    expect(parameters[2].headers.Authorization).toBe(token);
  });

  it(`should call axis put function passing the right parameters`, async () => {
    const mockPutFunc = jest.fn((url, data, config) =>
      Promise.resolve({
        data: responseData,
        status: StatusCodes.OK
      })
    );
    mockAxios.put.mockImplementation(mockPutFunc);
    const result = await http.put<FakeResponseData>(url, data, {
      Authorization: token
    });

    expect(result instanceof HttpResult).toBeTruthy();
    expect(result.status).toBe(StatusCodes.OK);
    expect(result.body.message).toBe(responseData.message);
    const parameters = mockPutFunc.mock.calls[0];
    expect(parameters[0]).toBe(url);
    expect(parameters[1]).toBe(data);
    expect(parameters[2].headers.Authorization).toBe(token);
  });

  it(`should call axios patch function passing the right parameters`, async () => {
    const mockPatchFunc = jest.fn((url, data, config) =>
      Promise.resolve({
        data: responseData,
        status: StatusCodes.OK
      })
    );
    mockAxios.patch.mockImplementation(mockPatchFunc);
    const result = await http.patch<FakeResponseData>(url, data, {
      Authorization: token
    });

    expect(result instanceof HttpResult).toBeTruthy();
    expect(result.status).toBe(StatusCodes.OK);
    expect(result.body.message).toBe(responseData.message);
    const parameters = mockPatchFunc.mock.calls[0];
    expect(parameters[0]).toBe(url);
    expect(parameters[1]).toBe(data);
    expect(parameters[2].headers.Authorization).toBe(token);
  });

  it(`should call axios delete function passing the right parameters`, async () => {
    const mockDeleteFunc = jest.fn((url, config) =>
      Promise.resolve({
        data: responseData,
        status: StatusCodes.OK
      })
    );
    mockAxios.delete.mockImplementation(mockDeleteFunc);
    const result = await http.delete<FakeResponseData>(url, {
      Authorization: token
    });

    expect(result instanceof HttpResult).toBeTruthy();
    expect(result.status).toBe(StatusCodes.OK);
    expect(result.body.message).toBe(responseData.message);
    const parameters = mockDeleteFunc.mock.calls[0];
    expect(parameters[0]).toBe(url);
    expect(parameters[1].headers.Authorization).toBe(token);
  });
});
