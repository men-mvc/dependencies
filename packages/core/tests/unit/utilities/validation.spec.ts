import {
  ValidationError as JoiValidationError,
  ValidationErrorItem
} from 'joi';
import { resolveValidationError, ValidationError } from '../../../src';

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
});
