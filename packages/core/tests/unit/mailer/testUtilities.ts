import { faker } from '@faker-js/faker';
import { MailAuthType, MailConfig, MailDriver } from '@men-mvc/config';
import sinon from 'sinon';
import _ from 'lodash';
import * as appUtilities from '../../../src/utilities/app';
import { LoginTransportOptions } from '../../../lib';

export const generateSendMailData = () => ({
  subject: faker.lorem.word(2),
  attachments: [],
  body: faker.lorem.paragraphs(3),
  to: faker.internet.email()
});

export const mockGetSourceCodeDirectory = (
  testSourceCodeDirectory: string = `${process.cwd()}/tests`
): sinon.SinonStub => {
  const getSourceCodeDirectoryStub = sinon.stub(
    appUtilities,
    `getSourceCodeDirectory`
  );
  getSourceCodeDirectoryStub.callsFake(
    jest.fn().mockReturnValue(testSourceCodeDirectory)
  );

  return getSourceCodeDirectoryStub;
};

export const generateMailConfig = (
  override: Partial<MailConfig> = {}
): MailConfig => {
  const defaultConfig: MailConfig = {
    driver: _.sample(Object.entries(MailDriver).map((tuple) => tuple[1])),
    user: faker.datatype.uuid(),
    password: faker.datatype.uuid(),
    host: faker.internet.url(),
    port: faker.internet.port(),
    service: faker.lorem.word(),
    secure: faker.datatype.boolean(),
    authType: _.sample(Object.entries(MailAuthType).map((tuple) => tuple[1])),
    tlsCiphers: faker.lorem.word(),
    clientId: faker.datatype.uuid(),
    clientSecret: faker.datatype.uuid(),
    refreshToken: faker.datatype.uuid(),
    accessToken: faker.datatype.uuid(),
    expires: faker.datatype.number()
  };

  return {
    ...defaultConfig,
    ...override
  };
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
