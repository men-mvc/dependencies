import joi, {
  ValidationError as JoiValidationError,
  ValidationErrorItem
} from 'joi';
import { faker } from '@faker-js/faker';
import {
  resolveValidationError,
  ValidationError,
  validateRequest
} from '../../../src';

describe(`Validation Utility`, () => {
  describe(`resolveValidationError`, () => {
    it(`should convert joi validation error into app-compatible format and return ValidationError`, () => {
      const errors: ValidationErrorItem[] = [
        createFakeValidationErrorItem(`name`, `Name is required.`),
        createFakeValidationErrorItem(`email`, `Email is required.`)
      ];
      const result = resolveValidationError(
        new JoiValidationError(`ValidationError`, errors, null)
      );
      expect(result instanceof ValidationError).toBeTruthy();
      expect(Object.keys(result.errors).length).toBe(2);
      Object.keys(result.errors).map((key, index) => {
        expect(result.errors[key]).toBe(errors[index].message);
        expect(key).toBe(errors[index].context?.key);
      });
    });

    const createFakeValidationErrorItem = (
      key: string,
      message: string
    ): ValidationErrorItem => ({
      message,
      path: [],
      type: `any`,
      context: {
        key
      }
    });
  });

  describe(`validateRequest`, () => {
    it(`should throw ValidationError when validation fails`, () => {
      try {
        const schema = joi.object().keys({
          name: joi.string().required().messages({
            'string.empty': `Name is required.`
          })
        });
        validateRequest(schema, { name: `` });
        throw new Error(`Expected error was not thrown`);
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`Error is not instance of ValidationError.`);
        }
        expect(e.errors['name']).toBe(`Name is required.`);
      }
    });

    it(`should not throw error when validation fails`, () => {
      const schema = joi.object().keys({
        name: joi.string().required().messages({
          'string.empty': `Name is required.`
        })
      });
      const result = validateRequest(schema, { name: faker.name.fullName() });
      expect(result).toBeUndefined();
    });
  });
});
