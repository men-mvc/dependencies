import { getMimeType } from '../../../src';

describe(`File Utilities`, () => {
  describe(`getMimeType`, () => {
    it(`should return mime type of the file path`, () => {
      expect(getMimeType(`test/test.png`)).toBe(`image/png`);
    });

    it(`should return null when it cannot find mime type for the given filepath`, () => {
      expect(getMimeType(`test/test`)).toBeNull();
    });
  });
});
