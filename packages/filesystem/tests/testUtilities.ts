import fs from 'fs';
import { getPrivateStorageDirectory } from '../src';

export const delay = (milliseconds: number = 500): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, milliseconds);
  });
};

export const deleteStorageDirectory = () => {
  if (!fs.existsSync(getPrivateStorageDirectory())) {
    return;
  }

  fs.rmdirSync(getPrivateStorageDirectory(), {
    recursive: true
  });
};
