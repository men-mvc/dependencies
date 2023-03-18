import { DeepPartial, UploadedFile } from '@men-mvc/globals';
import { faker } from '@faker-js/faker';
import fs from 'fs';
import { getAppStorageDirectory } from '../src';

export const delay = (milliseconds: number = 500): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, milliseconds);
  });
};

export const deleteStorageDirectory = () => {
  if (!fs.existsSync(getAppStorageDirectory())) {
    return;
  }

  fs.rmdirSync(getAppStorageDirectory(), {
    recursive: true
  });
};

export const generateUploadedFile = (
  data: DeepPartial<UploadedFile> = {}
): UploadedFile => {
  const defaultData: UploadedFile = {
    filepath: faker.datatype.uuid(),
    size: faker.datatype.number(2),
    originalFilename: `${faker.datatype.uuid()}.png`,
    mimetype: `image/png`
  };

  return new UploadedFile({ ...defaultData, ...data });
};
