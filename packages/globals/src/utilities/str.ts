import {v4 as uuidv4} from "uuid";

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
