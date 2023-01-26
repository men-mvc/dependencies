import { faker } from '@faker-js/faker';

export const generateSendMailData = () => ({
  subject: faker.lorem.word(2),
  attachments: [],
  body: faker.lorem.paragraphs(3),
  to: faker.internet.email()
});
