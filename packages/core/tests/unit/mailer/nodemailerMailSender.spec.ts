import sinon, { SinonStub } from 'sinon';
import nodemailer from 'nodemailer';
import { faker } from '@faker-js/faker';
import {
  NodemailerMailSender,
  SendMailOptions,
  TransportOptions
} from '../../../src';
import * as nodemailerSenderModule from '../../../src/mailer/nodemailerMailSender';

describe(`NodemailerMailSender`, () => {
  describe(`send`, () => {
    const fakeTransportOptions: TransportOptions = {
      host: `smtp.gmail.com`,
      port: 25,
      secure: faker.datatype.boolean(),
      auth: {
        user: faker.datatype.uuid(),
        pass: faker.datatype.uuid()
      },
      service: faker.lorem.word()
    };

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
    let sendMailMockFunc: jest.Mock;
    let createTransportStub: sinon.SinonStub;
    let createTransportMockFunc: jest.Mock;
    let getTransportOptionsStub: SinonStub;
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

    it(`should invoke the sendMail function passing the correct email content`, async () => {
      await mailer.send(mailInfo);

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
  });

  describe(`getTransportOptions`, () => {
    const mailer = new NodemailerMailSender();
    let getConfigStub: SinonStub;
    beforeEach(() => {
      NodemailerMailSender.transportOptions = null;
    });
    afterEach(() => {
      NodemailerMailSender.transportOptions = null;
      getConfigStub.restore();
    });

    it(`should only set user and pass props of auth when authType is empty`, () => {
      const fakeMailConfig = {
        host: `smtp@gmail.com`,
        port: 25,
        secure: faker.datatype.boolean(),
        user: faker.datatype.uuid(),
        password: faker.datatype.uuid(),
        clientId: faker.datatype.uuid(), // this will not be set.
        clientSecret: faker.datatype.uuid(), // this will not be set.
        refreshToken: faker.datatype.uuid(), // this will not be set.
        accessToken: faker.datatype.uuid(), // this will not be set
        expires: faker.datatype.number(4), // this will not be set
        service: faker.lorem.word(),
        tlsCiphers: faker.lorem.word()
      };
      getConfigStub = mockGetConfig(fakeMailConfig);
      const transportOptions = mailer._getTransportOptions();
      assertCommonTransportOptionsProps(transportOptions, fakeMailConfig);
      expect(transportOptions.auth.pass).toBe(fakeMailConfig.password);
      expect(transportOptions.auth.clientId).toBeUndefined();
      expect(transportOptions.auth.clientSecret).toBeUndefined();
      expect(transportOptions.auth.refreshToken).toBeUndefined();
      expect(transportOptions.auth.accessToken).toBeUndefined();
      expect(transportOptions.auth.expires).toBeUndefined();
      expect(transportOptions.service).toBe(fakeMailConfig.service);
      expect(transportOptions.tls?.ciphers).toBe(fakeMailConfig.tlsCiphers);
    });

    it(`should set oauth2 props of auth when authType is OAuth2`, () => {
      const fakeMailConfig = {
        host: `smtp@gmail.com`,
        port: 25,
        secure: faker.datatype.boolean(),
        authType: 'OAuth2',
        user: faker.datatype.uuid(),
        password: faker.datatype.uuid(), // this will not be set.
        clientId: faker.datatype.uuid(),
        clientSecret: faker.datatype.uuid(),
        refreshToken: faker.datatype.uuid(),
        accessToken: faker.datatype.uuid(),
        expires: faker.datatype.number(4),
        service: faker.lorem.word(),
        tlsCiphers: faker.lorem.word()
      };
      getConfigStub = mockGetConfig(fakeMailConfig);
      const transportOptions = mailer._getTransportOptions();
      assertCommonTransportOptionsProps(transportOptions, fakeMailConfig);
      expect(transportOptions.auth.pass).toBeUndefined();
      expect(transportOptions.auth.clientId).toBe(fakeMailConfig.clientId);
      expect(transportOptions.auth.clientSecret).toBe(
        fakeMailConfig.clientSecret
      );
      expect(transportOptions.auth.refreshToken).toBe(
        fakeMailConfig.refreshToken
      );
      expect(transportOptions.auth.accessToken).toBe(
        fakeMailConfig.accessToken
      );
      expect(transportOptions.auth.expires).toBe(fakeMailConfig.expires);
      expect(transportOptions.service).toBe(fakeMailConfig.service);
      expect(transportOptions.tls?.ciphers).toBe(fakeMailConfig.tlsCiphers);
    });

    const mockGetConfig = (fakeMailConfig: { [key: string]: unknown }) => {
      const stub = sinon.stub(nodemailerSenderModule, 'getConfig');
      stub.callsFake(
        jest.fn().mockReturnValue({
          mail: fakeMailConfig
        })
      );

      return stub;
    };

    const assertCommonTransportOptionsProps = (
      transportOptions: TransportOptions,
      fakeMailConfig: { [key: string]: unknown }
    ) => {
      expect(transportOptions.host).toBe(fakeMailConfig.host);
      expect(transportOptions.port).toBe(fakeMailConfig.port);
      expect(transportOptions.secure).toBe(fakeMailConfig.secure);
      expect(transportOptions.auth.user).toBe(fakeMailConfig.user);
    };
  });
});
