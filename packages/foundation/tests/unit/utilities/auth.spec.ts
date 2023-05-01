import { faker } from '@faker-js/faker';
import {
  authorizeAsync,
  authorizeSync,
  generateVerificationToken,
  hashPassword,
  validatePassword
} from '../../../src';

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

  describe(`authorizeSync`, () => {
    const authFunc = (actualValue: string, expectedValue: string) =>
      actualValue === expectedValue;

    it(`should throw error when function returns false`, async () => {
      expect(() => {
        authorizeSync(() => authFunc('test', 'testxxx'));
      }).toThrow(`Insufficient permissions.`);
    });

    it(`should not throw error when function returns true`, async () => {
      expect(() => {
        authorizeSync(() => authFunc('test', 'test'));
      }).not.toThrow(`Insufficient permissions.`);
    });

    it(`should use the error message when provided`, async () => {
      expect(() => {
        authorizeSync(() => authFunc('test', 'testxxx'), 'test error');
      }).toThrow(`test error`);
    });
  });

  describe(`authorizeAsync`, () => {
    const authFunc = (
      actualValue: string,
      expectedValue: string
    ): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        setTimeout(() => {
          resolve(actualValue === expectedValue);
        }, 300);
      });
    };

    it(`should throw error when function returns false`, async () => {
      await expect(
        authorizeAsync(() => authFunc('test', 'testxxx'))
      ).rejects.toThrow(`Insufficient permissions.`);
    });

    it(`should not throw error when function returns true`, async () => {
      await expect(
        authorizeAsync(() => authFunc('test', 'test'))
      ).resolves.not.toThrow(`Insufficient permissions.`);
    });

    it(`should use the error message when provided`, async () => {
      await expect(
        authorizeAsync(() => authFunc('test', 'testxxx'), 'test error')
      ).rejects.toThrow(`test error`);
    });
  });
});
