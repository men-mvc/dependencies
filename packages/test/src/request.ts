import { Express } from 'express';
import supertest, { Test } from 'supertest';
import { MultipartValue } from './multipartValue';
import { FakeUploadedFile } from './fakeUploadedFile';

type TestFormData = {
  [key: string]: MultipartValue | FakeUploadedFile;
};

const attachDataToRequest = (
  request: Test,
  formData: TestFormData,
  headers?: { [key: string]: string }
): Test => {
  if (headers) {
    for (const prop in headers) {
      request.set(prop, headers[prop]);
    }
  }
  for (const prop in formData) {
    const fieldValue = formData[prop];
    if (fieldValue instanceof FakeUploadedFile) {
      if (Array.isArray(fieldValue.mockFile)) {
        fieldValue.mockFile.map((mockFile) => {
          request.attach(prop, mockFile);
        });
      } else {
        request.attach(prop, fieldValue.mockFile);
      }
    } else {
      request.field(prop, fieldValue);
    }
  }

  return request;
};

export const makePostFormDataRequest = async (
  app: Express,
  path: string,
  formData: TestFormData,
  headers?: { [key: string]: string }
): Promise<Test> => makeFormDataRequest(app, `post`, path, formData, headers);

export const makePutFormDataRequest = async (
  app: Express,
  path: string,
  formData: TestFormData,
  headers?: { [key: string]: string }
): Promise<Test> => makeFormDataRequest(app, `put`, path, formData, headers);

export const makeFormDataRequest = async (
  app: Express,
  verb: 'post' | 'put',
  path: string,
  formData: TestFormData,
  headers?: { [key: string]: string }
): Promise<Test> => {
  let request: Test;
  if (verb == 'put') {
    request = supertest(app).put(path);
  } else {
    request = supertest(app).post(path);
  }
  request = attachDataToRequest(request, formData, headers);

  return request;
};
