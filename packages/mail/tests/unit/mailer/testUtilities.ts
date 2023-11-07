import { faker } from '@faker-js/faker';
import { MailAuthType, MailConfig, MailDriver } from '@men-mvc/config';
import _ from 'lodash';
import { LoginTransportOptions } from '../../../src';

export const generateSendMailData = () => ({
  subject: faker.lorem.word(2),
  attachments: [],
  body: faker.lorem.paragraphs(3),
  to: faker.internet.email()
});

export const generateMailConfig = (
  override: Partial<MailConfig> = {}
): MailConfig => {
  const defaultConfig: MailConfig = {
    driver: _.sample(Object.entries(MailDriver).map((tuple) => tuple[1])),
    nodemailer: {
      user: faker.datatype.uuid(),
      password: faker.datatype.uuid(),
      host: faker.internet.url(),
      port: faker.internet.port(),
      service: faker.lorem.word(),
      secure: faker.datatype.boolean(),
      authType: _.sample(Object.entries(MailAuthType).map((tuple) => tuple[1])),
      tlsCiphers: faker.lorem.word(),
      tlsRejectUnauthorized: faker.datatype.boolean(),
      clientId: faker.datatype.uuid(),
      clientSecret: faker.datatype.uuid(),
      refreshToken: faker.datatype.uuid(),
      accessToken: faker.datatype.uuid(),
      expires: faker.datatype.number()
    }
  };

  return _.merge(defaultConfig, override);
};

export const generateLoginTransportOptions = (): LoginTransportOptions => ({
  host: `smtp.gmail.com`,
  port: 25,
  secure: faker.datatype.boolean(),
  auth: {
    user: faker.datatype.uuid(),
    pass: faker.datatype.uuid()
  },
  service: faker.lorem.word()
});
