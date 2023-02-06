import sinon from 'sinon';
import path from 'path';
import {
  getPartialViewNameForTemplate,
  setServerDirectory,
  withLayout
} from '../../../src';
import { mockGetSourceCodeDirectory } from './testUtilities';

describe('mail utilities', () => {
  describe(`getPartialViewNameForTemplate`, () => {
    it(`should remove path separators, fore-slashes and hyphens with underscore`, () => {
      expect(
        getPartialViewNameForTemplate(
          `customers/orders${path.sep}order-created`
        )
      ).toBe(`customers_orders_order_created`);
    });

    it(`should remove the leading fore slash`, () => {
      expect(getPartialViewNameForTemplate(`/orderCreated`)).toBe(
        `orderCreated`
      );
    });

    it(`should remove the leading file separator`, () => {
      expect(getPartialViewNameForTemplate(`${path.sep}orderCreated`)).toBe(
        `orderCreated`
      );
    });
  });

  describe(`withLayout`, () => {
    let getSourceCodeDirectoryStub: sinon.SinonStub;

    beforeEach(
      () => (getSourceCodeDirectoryStub = mockGetSourceCodeDirectory())
    );
    afterEach(() => getSourceCodeDirectoryStub.restore());

    it(`should return the html wrapping the input html with the default layout html`, async () => {
      const contentHtml = `<p>Greeting from Wai.</p>`;
      const expectedHtml = `<html>
  <head>
    <title>Email Template</title>
  </head>
  <body>
    ${contentHtml}
  </body>
</html>`
      const actualHtml = await withLayout(contentHtml);

      expect(actualHtml).toBe(expectedHtml);
    });
  });
});
