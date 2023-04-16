import fs from 'fs';
import { getPrivateStorageDirectory, getStorageDirectory } from '../src';

export const delay = (milliseconds: number = 500): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, milliseconds);
  });
};

export const deleteStorageDirectory = () => {
  if (!fs.existsSync(getStorageDirectory())) {
    return;
  }

  fs.rmdirSync(getStorageDirectory(), {
    recursive: true
  });
};
