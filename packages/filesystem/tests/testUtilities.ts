import { DeepPartial, UploadedFile } from '@men-mvc/foundation';
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
