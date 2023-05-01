import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateUuid } from './str';
import { InsufficientPermissionError } from '../types';

export const hashPassword = async (
  plainTextPassword: string
): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainTextPassword, salt);
};

export const validatePassword = async (
  plainText: string,
  hash: string
): Promise<boolean> => await bcrypt.compare(plainText, hash);

export const generateVerificationToken = (): string =>
  `${generateUuid()}-${crypto.randomBytes(32).toString('hex')}`;

export const authorizeSync = (
  authFunc: () => boolean,
  error?: string
): void => {
  if (!authFunc()) {
    throw new InsufficientPermissionError(error);
  }
};

export const authorizeAsync = async (
  authFunc: () => Promise<boolean>,
  error?: string
): Promise<void> => {
  if (!(await authFunc())) {
    throw new InsufficientPermissionError(error);
  }
};
