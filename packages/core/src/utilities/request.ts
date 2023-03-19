import { Request } from 'express';

export const extractBearerToken = (request: Request): string | null => {
  const authHeader = request.header('Authorization');
  if (!authHeader) {
    return null;
  }
  const tokens = authHeader.split(' ');
  if (tokens.length !== 2) {
    return null;
  }
  if (tokens[0] !== 'Bearer') {
    return null;
  }

  return tokens[1] ? tokens[1] : null;
};
