import { MailTemplateBuilder } from '../../../src/mailTemplateBuilder';
import { faker } from '@faker-js/faker';
import {
  getServerDirectory,
  setServerDirectory
} from '../../../src/foundation';
import path from 'path';

const templateBuilder: MailTemplateBuilder = MailTemplateBuilder.getInstance();
const originalServerDirectory: string = getServerDirectory();

describe(`MailTemplateBuilder`, () => {
  beforeAll(() => {
    setServerDirectory(path.join(process.cwd(), 'tests'));
  });

  afterAll(() => {
    setServerDirectory(originalServerDirectory);
  });

  describe(`getInstance`, () => {
    it(`should return the same instance`, async () => {
      const instance1 = MailTemplateBuilder.getInstance();
      const instance2 = MailTemplateBuilder.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe(`build`, () => {
    it(`should return the html of basic template without layout`, async () => {
      const expectedHtml = `<html>
  <head>
    <title>Basic Template</title>
  </head>
  <body>
    <p>Hello world!</p>
  </body>
</html>`;

      expect(templateBuilder.build('layoutLessBasic', null)).toBe(expectedHtml);
    });

    it(`should return the html of basic template with layout`, async () => {
      const expectedHtml = `<html>
  <head>
    <title>Email Template</title>
  </head>
  <body>
    <p>Greetings from Wai.</p>;
  </body>
</html>`;

      expect(templateBuilder.build('basic', null, 'layout')).toBe(expectedHtml);
    });

    it(`should return the html of data template without layout`, async () => {
      const name = faker.lorem.word();
      const expectedHtml = `<html>
  <head>
    <title>Data Template</title>
  </head>
  <body>
    <p>Hello ${name}!</p>
  </body>
</html>`;

      expect(
        templateBuilder.build('layoutLessData', {
          name
        })
      ).toBe(expectedHtml);
    });

    it(`should return the html of data template with layout`, async () => {
      const name = faker.lorem.word();
      const expectedHtml = `<html>
  <head>
    <title>Email Template</title>
  </head>
  <body>
    <p>Hello ${name}!</p>
  </body>
</html>`;

      expect(
        templateBuilder.build(
          'data',
          {
            name
          },
          'layout'
        )
      ).toBe(expectedHtml);
    });

    it(`should render the basic re-usable component`, async () => {
      const expectedHtml = `<html>
  <head>
    <title>Email Template</title>
  </head>
  <body>
    <p>
  I have a basic component.
  <p>Greetings from the basic component.</p>
</p>
  </body>
</html>`;

      expect(
        templateBuilder.build('basicComponentHolder', null, 'layout')
      ).toBe(expectedHtml);
    });

    it(`should render the re-usable component with data`, async () => {
      const data = {
        userId: faker.datatype.uuid(),
        firstName: faker.lorem.word(),
        lastName: faker.lorem.word()
      };
      const expectedHtml = `<html>
  <head>
    <title>Email Template</title>
  </head>
  <body>
    <p>
  User ID:
  ${data.userId}
</p>
<p>Welcome ${data.firstName} ${data.lastName}!</p>
  </body>
</html>`;

      expect(templateBuilder.build('dataComponentHolder', data, 'layout')).toBe(
        expectedHtml
      );
    });

    it(`can have multiple re-usable components inside a template`, async () => {
      const data = {
        userId: faker.datatype.uuid(),
        firstName: faker.lorem.word(),
        lastName: faker.lorem.word(),
        email: faker.internet.email()
      };
      const expectedHtml = `<html>
  <head>
    <title>Email Template</title>
  </head>
  <body>
    <p>
  User ID:
  ${data.userId}
</p>
<p>Welcome ${data.firstName} ${data.lastName}!</p>
<p>Email: ${data.email}</p>
  </body>
</html>`;

      expect(
        templateBuilder.build('siblingComponentsHolder', data, 'layout')
      ).toBe(expectedHtml);
    });

    it(`can have re-usable component inside another re-usable component`, async () => {
      const data = {
        userId: faker.datatype.uuid(),
        firstName: faker.lorem.word(),
        lastName: faker.lorem.word(),
        status: faker.lorem.word()
      };
      const expectedHtml = `<html>
  <head>
    <title>Email Template</title>
  </head>
  <body>
    <p>
  User ID:
  ${data.userId}
</p>
<p>
  Name:
  ${data.firstName}
  ${data.lastName}
</p>
<p>Status: ${data.status}</p>
  </body>
</html>`;

      expect(
        templateBuilder.build('multiLayerComponentsHolder', data, 'layout')
      ).toBe(expectedHtml);
    });

    it(`should render re-usable component within the loop`, async () => {
      const expectedHtml = `<html>
  <head>
    <title>Email Template</title>
  </head>
  <body>
    <h3>Items</h3>
  <div>
  <h4>Item: id-1</h4>
  <h4>Name: item 1</h4>
  <h4>Price: 12.5</h4>
</div>
  <div>
  <h4>Item: id-2</h4>
  <h4>Name: item 2</h4>
  <h4>Price: 12.1</h4>
</div>

  </body>
</html>`;
      expect(
        templateBuilder.build(
          'loop',
          {
            items: [
              {
                id: `id-1`,
                name: `item 1`,
                price: `12.5`
              },
              {
                id: `id-2`,
                name: `item 2`,
                price: `12.1`
              }
            ]
          },
          'layout'
        )
      ).toBe(expectedHtml);
    });
  });
});
