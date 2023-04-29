import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

export const isNumber = (str: string): boolean => {
  if (typeof str !== 'string') {
    return false;
  }
  if (str.trim() === '') {
    return false;
  }

  return !Number.isNaN(Number(str));
};

export const generateUuid = () => uuidv4();

const readReadableAsStringPromise = (readable: Readable): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const strings: string[] = [];
    readable.on(`data`, (chunk) => {
      strings.push(chunk.toString());
    });
    readable.on(`end`, () => resolve(strings.join()));
    readable.on(`error`, (err) => reject(err));
  });
};

// TODO: unit test even thought this is already tested in the tests for other components
export const readReadableAsString = async (
  readable: Readable
): Promise<string> => {
  try {
    return await readReadableAsStringPromise(readable);
  } catch (e) {
    throw e;
  }
};
