import { Request } from 'express';
import { faker } from '@faker-js/faker';
import { extractBearerToken } from '../../../src';

describe(`Request Utility`, () => {
  describe(`extractBearerToken`, () => {
    it(`should return null when Authorization header is empty`, () => {
      const req = {
        header: (header) => ``
      } as Request;

      const token = extractBearerToken(req);
      expect(token).toBeNull();
    });

    it(`should return null when Authorization header value has more than two segments`, () => {
      const req = {
        header: (header) =>
          `Bearer ${faker.datatype.uuid()} ${faker.datatype.uuid()}`
      } as Request;

      const token = extractBearerToken(req);
      expect(token).toBeNull();
    });

    it(`should return null when Authorization header value has less than two segments`, () => {
      const req = {
        header: (header) => `Bearer`
      } as Request;

      const token = extractBearerToken(req);
      expect(token).toBeNull();
    });

    it(`should return null when the first segment iof the Authorization header value is not Bearer`, () => {
      const req = {
        header: (header) => `Bxarer`
      } as Request;

      const token = extractBearerToken(req);
      expect(token).toBeNull();
    });

    it(`should return the token`, () => {
      const fakeToken = faker.datatype.uuid();
      const req = {
        header: (header) => `Bearer ${fakeToken}`
      } as Request;

      const token = extractBearerToken(req);
      expect(token).toBe(fakeToken);
    });
  });
});
