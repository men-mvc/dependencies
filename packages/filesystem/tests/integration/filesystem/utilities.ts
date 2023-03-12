import { faker } from '@faker-js/faker';
import path from 'path';
import {
  FakeUploadedFile,
  makePostFormDataRequest,
  MultipartValue
} from '@men-mvc/test';
import { getTestExpressApp } from '../utilities';

const originalFilesDir = path.join(
  __dirname,
  `support${path.sep}files${path.sep}original`
);
export const makeFormDataRequest = async (formData: {
  [key: string]: MultipartValue | FakeUploadedFile;
}) =>
  makePostFormDataRequest(
    await getTestExpressApp(),
    `/fileSystem/parseFormData`,
    formData
  );

export const generateSimpleFormDataPayload = () => ({
  name: faker.name.fullName(),
  email: faker.internet.email(),
  photoFile: new FakeUploadedFile(path.join(originalFilesDir, `node.png`)),
  additionalFiles: new FakeUploadedFile([
    path.join(originalFilesDir, `react.png`),
    path.join(originalFilesDir, `dummy-doc-1.pdf`)
  ])
});
