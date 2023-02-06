import { faker } from '@faker-js/faker';
import sinon from 'sinon';
import * as appUtilities from '../../../src/utilities/app';

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
