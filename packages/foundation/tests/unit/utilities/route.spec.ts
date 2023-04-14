import { replaceRouteParams } from '../../../src';

describe(`Route Utilities`, () => {
  describe(`replaceRouteParams`, () => {
    it(`should replace parameter placeholders with values`, () => {
      expect(
        replaceRouteParams(`/:company/user/:name/update`, {
          company: 'test-company',
          name: 'test-user-name'
        })
      ).toBe(`/test-company/user/test-user-name/update`);
    });

    it(`should return return empty string when url is empty`, () => {
      expect(
        replaceRouteParams(``, {
          company: 'test-company',
          name: 'test-user-name'
        })
      ).toBe(``);
    });
  });
});
