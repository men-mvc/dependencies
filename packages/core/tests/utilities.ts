import rimraf from 'rimraf';
import { DeepPartial, getAppStorageDirectory, UploadedFile } from '../src';
import { faker } from '@faker-js/faker';

export const delay = (milliseconds: number): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, milliseconds);
  });
};

export const deleteStorageDirectory = () =>
  rimraf.sync(getAppStorageDirectory());

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
