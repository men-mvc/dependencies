import { faker } from '@faker-js/faker';
import {
  generateVerificationToken,
  hashPassword,
  validatePassword
} from '../../../src/utilities/auth';

describe(`Auth Utility`, () => {
  describe(`hashPassword`, () => {
    it(`should hash the password`, async () => {
      const plainTextPassword = faker.internet.password();
      const hashedPassword = await hashPassword(plainTextPassword);
      expect(plainTextPassword).not.toBe(hashedPassword);
      expect(hashedPassword.length).toBe(60);
    });
  });

  describe(`validatePassword`, () => {
    it(`should return true when password is valid`, async () => {
      const plainTextPassword = faker.internet.password();
      const hashedPassword = await hashPassword(plainTextPassword);
      expect(
        await validatePassword(plainTextPassword, hashedPassword)
      ).toBeTruthy();
    });

    it(`should return false when password is invalid`, async () => {
      const plainTextPassword = faker.internet.password();
      const hashedPassword = await hashPassword(plainTextPassword);
      expect(
        await validatePassword(hashedPassword, faker.internet.password())
      ).toBeFalsy();
    });
  });

  describe(`generateVerificationToken`, () => {
    it(`should generate a verification token in the correct length`, async () => {
      expect(generateVerificationToken().length).toBe(101);
    });
  });
});
