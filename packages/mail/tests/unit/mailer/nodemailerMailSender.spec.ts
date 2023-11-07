import nodemailer from 'nodemailer';
import sinon, { SinonStub } from 'sinon';
import { MailAuthType, MailConfig } from '@men-mvc/config';
import { faker } from '@faker-js/faker';
import path from 'path';
import { NodemailerMailSender, TransportOptions } from '../../../src';
import {
  generateLoginTransportOptions,
  generateMailConfig
} from './testUtilities';
import {
  HtmlSendMailOptions,
  TemplateSendMailOptions,
  SendMailOptions
} from '../../../src';
import {
  getServerDirectory,
  setServerDirectory
} from '../../../src/foundation';
import * as mailUtilities from '../../../src/utilities';

const serverDirectoryBeforeTests = getServerDirectory();
describe(`NodemailerMailSender`, () => {
  describe(`send`, () => {
    const fakeTransportOptions: TransportOptions =
      generateLoginTransportOptions();

    const mailer = new NodemailerMailSender();
    let sendMailMockFunc: jest.Mock;
    let createTransportStub: sinon.SinonStub;
    let createTransportMockFunc: jest.Mock;
    let getTransportOptionsStub: SinonStub;

    beforeAll(() => {
      setServerDirectory(path.join(process.cwd(), 'tests'));
    });
    afterAll(() => {
      setServerDirectory(serverDirectoryBeforeTests);
    });

    beforeEach(() => {
      mockGetTransportOptions();
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
      getTransportOptionsStub.restore();
    });

    it(`should create transport with the right options`, async () => {
      const mailInfo = generateSendMailOptions() as HtmlSendMailOptions;
      await mailer.send(mailInfo);

      expect(createTransportMockFunc.mock.calls.length).toBe(1);
      const createTransportCall = createTransportMockFunc.mock.calls[0];
      const options = createTransportCall[0];
      expect(options.host).toBe(fakeTransportOptions.host);
      expect(options.port).toBe(fakeTransportOptions.port);
      expect(options.secure).toBe(fakeTransportOptions.secure);
      expect(options.auth.user).toBe(fakeTransportOptions.auth.user);
      expect(options.auth.pass).toBe(fakeTransportOptions.auth.pass);
      expect(options.service).toBe(fakeTransportOptions.service);
    });

    it(`should invoke the sendMail function passing the correct email content without using template`, async () => {
      const mailInfo = generateSendMailOptions() as HtmlSendMailOptions;
      await mailer.send(mailInfo);

      assertMailSentWithTheRightData(mailInfo);
    });

    it(`should invoke the sendMail function passing the correct email content using the template with data`, async () => {
      const template = {
        view: 'welcome',
        data: {
          name: 'Wai Yan Hein'
        },
        layout: 'layout'
      };
      const mailInfo = generateSendMailOptions(
        template
      ) as TemplateSendMailOptions;
      await mailer.send(mailInfo);

      const expectedMailBody = `<html>
  <head>
    <title>Email Template</title>
  </head>
  <body>
    <p>Welcome ${template.data.name}!</p>
  </body>
</html>`;
      assertMailSentWithTheRightData({
        ...mailInfo,
        body: expectedMailBody,
        template: undefined
      } as HtmlSendMailOptions);
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
      createTransportMockFunc = jest.fn().mockReturnValue(mockTransporter);
      createTransportStub.callsFake(createTransportMockFunc);
    };

    const mockGetTransportOptions = () => {
      getTransportOptionsStub = sinon.stub(mailer, '_getTransportOptions');
      getTransportOptionsStub.callsFake(
        jest.fn().mockReturnValue(fakeTransportOptions)
      );
    };

    // to assert email is sent using a template, passed the finalised content of the template to body prop
    const assertMailSentWithTheRightData = (mailInfo: HtmlSendMailOptions) => {
      expect(sendMailMockFunc.mock.calls.length).toBe(1);
      const sendMailCall = sendMailMockFunc.mock.calls[0];
      expect(sendMailCall[0].from).toBe(fakeTransportOptions.auth.user);
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
    };

    const generateSendMailOptions = (template?: {
      view: string;
      data?: Record<string, unknown>;
    }): SendMailOptions => {
      const commonOptions = {
        to: faker.internet.email(),
        subject: faker.lorem.words(2),
        attachments: Array.from(Array(3).keys()).map((element) => {
          return {
            filename: `${faker.lorem.word()}.png`,
            path: `storage/${faker.lorem.word()}.png`
          };
        })
      };

      return template
        ? {
            ...commonOptions,
            template
          }
        : {
            ...commonOptions,
            body: faker.lorem.paragraphs(3)
          };
    };
  });

  describe(`getTransportOptions`, () => {
    const mailer = new NodemailerMailSender();
    let getMailConfigStub: SinonStub;
    beforeEach(() => {
      NodemailerMailSender.transportOptions = null;
    });
    afterEach(() => {
      NodemailerMailSender.transportOptions = null;
      getMailConfigStub.restore();
    });

    it(`should return login transport options when authType is empty`, () => {
      const fakeMailConfig: MailConfig = generateMailConfig({
        nodemailer: {
          user: '',
          authType: undefined
        }
      });
      getMailConfigStub = mockGetMailConfig(fakeMailConfig);
      const transportOptions = mailer._getTransportOptions();

      assertLoginTransportOptions(transportOptions, fakeMailConfig);
    });

    it(`should return login transport options when authType is LOGIN`, () => {
      const fakeMailConfig: MailConfig = generateMailConfig({
        nodemailer: {
          user: '',
          authType: MailAuthType.Login
        }
      });
      getMailConfigStub = mockGetMailConfig(fakeMailConfig);
      const transportOptions = mailer._getTransportOptions();

      assertLoginTransportOptions(transportOptions, fakeMailConfig);
    });

    it(`should return OAuth2 transport options when authType is OAuth2`, () => {
      const fakeMailConfig: MailConfig = generateMailConfig({
        nodemailer: {
          user: '',
          authType: MailAuthType.OAuth2
        }
      });
      getMailConfigStub = mockGetMailConfig(fakeMailConfig);
      const transportOptions = mailer._getTransportOptions();

      assertOAuth2TransportOptions(transportOptions, fakeMailConfig);
    });

    const mockGetMailConfig = (fakeMailConfig: MailConfig) => {
      const stub = sinon.stub(mailUtilities, 'getMailConfig');
      stub.callsFake(jest.fn().mockReturnValue(fakeMailConfig));

      return stub;
    };

    const assertCommonTransportOptions = (
      transportOptions: TransportOptions,
      fakeMailConfig: MailConfig
    ) => {
      expect(transportOptions.host).toBe(fakeMailConfig.nodemailer?.host);
      expect(transportOptions.port).toBe(fakeMailConfig.nodemailer?.port);
      expect(transportOptions.secure).toBe(fakeMailConfig.nodemailer?.secure);
      expect(transportOptions.tls?.ciphers).toBe(
        fakeMailConfig.nodemailer?.tlsCiphers
      );
      expect(transportOptions.service).toBe(fakeMailConfig.nodemailer?.service);
      expect(transportOptions.tls?.rejectUnauthorized).toBe(
        fakeMailConfig.nodemailer?.tlsRejectUnauthorized
      );
    };

    const assertLoginTransportOptions = (
      transportOptions: TransportOptions,
      fakeMailConfig: MailConfig
    ) => {
      assertCommonTransportOptions(transportOptions, fakeMailConfig);
      if (transportOptions.auth?.type === undefined) {
        expect(transportOptions.auth.user).toBe(
          fakeMailConfig.nodemailer?.user
        );
        expect(transportOptions.auth.pass).toBe(
          fakeMailConfig.nodemailer?.password
        );
      } else {
        throw new Error(`Transport type is not LOGIN.`);
      }
    };

    const assertOAuth2TransportOptions = (
      transportOptions: TransportOptions,
      fakeMailConfig: MailConfig
    ) => {
      assertCommonTransportOptions(transportOptions, fakeMailConfig);
      if (transportOptions.auth?.type === MailAuthType.OAuth2) {
        expect(transportOptions.auth.type).toBe(MailAuthType.OAuth2);
        expect(transportOptions.auth.user).toBe(
          fakeMailConfig.nodemailer?.user
        );
        expect(transportOptions.auth.pass).toBe(
          fakeMailConfig.nodemailer?.password
        );
        expect(transportOptions.auth.expires).toBe(
          fakeMailConfig.nodemailer?.expires
        );
        expect(transportOptions.auth.accessToken).toBe(
          fakeMailConfig.nodemailer?.accessToken
        );
        expect(transportOptions.auth.refreshToken).toBe(
          fakeMailConfig.nodemailer?.refreshToken
        );
        expect(transportOptions.auth.clientId).toBe(
          fakeMailConfig.nodemailer?.clientId
        );
        expect(transportOptions.auth.clientSecret).toBe(
          fakeMailConfig.nodemailer?.clientSecret
        );
      } else {
        throw new Error(`Transport type is not OAuth2.`);
      }
    };
  });
});
