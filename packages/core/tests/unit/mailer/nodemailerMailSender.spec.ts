import sinon from 'sinon';
import { coreTestConfig } from '@men-mvc/config';
import nodemailer from 'nodemailer';
import { faker } from '@faker-js/faker';
import { NodemailerMailSender, SendMailOptions } from '../../../src';

const mailInfo: SendMailOptions = {
  to: faker.internet.email(),
  subject: faker.lorem.words(2),
  attachments: Array.from(Array(3).keys()).map((element) => {
    return {
      filename: `${faker.lorem.word()}.png`,
      path: `storage/${faker.lorem.word()}.png`
    };
  }),
  body: faker.lorem.paragraphs(3)
};
const mailer = new NodemailerMailSender();
describe(`NodemailerMailSender`, () => {
  describe(`send`, () => {
    // TODO: try using before all and after all
    let sendMailMockFunc: jest.Mock;
    let createTransportStub: sinon.SinonStub;
    let createTransportMockFunc: jest.Mock;
    beforeEach(() => {
      mockSendMail();
      const mockTransporter = {
        sendMail: sendMailMockFunc
      };
      mockCreateTransport(mockTransporter);
    });
    afterEach(() => {
      sendMailMockFunc.mockRestore();
      createTransportStub.restore();
      createTransportMockFunc.mockRestore();
    });

    it(`should create transport with the right options`, async () => {
      await mailer.send(mailInfo);

      expect(createTransportMockFunc.mock.calls.length).toBe(1);
      const createTransportCall = createTransportMockFunc.mock.calls[0];
      const options = createTransportCall[0];
      expect(options.host).toBe(coreTestConfig.mail.host);
      expect(options.port).toBe(coreTestConfig.mail.port);
      expect(options.secure).toBeTruthy();
      expect(options.auth.user).toBe(coreTestConfig.mail.address);
      expect(options.auth.pass).toBe(coreTestConfig.mail.password);
      expect(options.service).toBe(coreTestConfig.mail.service);
    });

    it(`should invoke the sendMail function passing the correct email content`, async () => {
      await mailer.send(mailInfo);

      expect(sendMailMockFunc.mock.calls.length).toBe(1);
      const sendMailCall = sendMailMockFunc.mock.calls[0];
      expect(sendMailCall[0].from).toBe(coreTestConfig.mail.address);
      expect(sendMailCall[0].to).toBe(mailInfo.to);
      expect(sendMailCall[0].subject).toBe(mailInfo.subject);
      expect(sendMailCall[0].html).toBe(mailInfo.body);
      expect(sendMailCall[0].attachments.length).toBe(3);
      if (!mailInfo.attachments || mailInfo.attachments.length < 1) {
        throw new Error(`Attachments are not tested.`);
      }
      mailInfo.attachments.map((attachment, index) => {
        expect(attachment.filename).toBe(
          sendMailCall[0].attachments[index].filename
        );
        expect(attachment.path).toBe(sendMailCall[0].attachments[index].path);
      });
    });

    const mockSendMail = () => {
      sendMailMockFunc = jest
        .fn()
        .mockImplementation((options: nodemailer.TransportOptions) => {
          return Promise.resolve();
        });
    };

    const mockCreateTransport = (mockTransporter: { sendMail: jest.Mock }) => {
      createTransportStub = sinon.stub(nodemailer, `createTransport`);
      createTransportMockFunc = jest
        .fn()
        .mockImplementation((options) => mockTransporter);
      createTransportStub.callsFake(createTransportMockFunc);
    };
  });
});
