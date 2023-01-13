import rimraf from 'rimraf';
import { getAppStorageDirectory } from '../src';

export const delay = (milliseconds: number): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, milliseconds);
  });
};

export const deleteStorageDirectory = () =>
  rimraf.sync(getAppStorageDirectory());
