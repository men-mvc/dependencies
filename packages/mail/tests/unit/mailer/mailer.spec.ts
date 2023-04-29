import { MailDriver } from '@men-mvc/config';
import sinon, { SinonStub } from 'sinon';
import {
  ConsoleLogMailSender,
  FileLogMailSender,
  Mailer,
  NodemailerMailSender
} from '../../../src';
import * as mailUtilities from '../../../src/utilities';

describe(`Mailer`, () => {
  describe(`getInstance`, () => {
    let getMailDriverStub: SinonStub;

    beforeEach(() => {
      Mailer.resetInstance();
    });

    afterEach(() => {
      getMailDriverStub.restore();
    });

    it(`should return the instance of NodemailerMailerMailSender when the driver is mail`, () => {
      mockGetMailDriver(MailDriver.mail);
      const instance = Mailer.getInstance();
      expect(instance instanceof NodemailerMailSender).toBeTruthy();
    });

    it(`should return the instance of NodemailerMailerMailSender when the driver is not specified`, () => {
      mockGetMailDriver(undefined);
      const instance = Mailer.getInstance();
      expect(instance instanceof NodemailerMailSender).toBeTruthy();
    });

    it(`should return the instance of ConsoleLogMailSender when the driver is console_log`, () => {
      mockGetMailDriver(MailDriver.consoleLog);
      const instance = Mailer.getInstance();
      expect(instance instanceof ConsoleLogMailSender).toBeTruthy();
    });

    it(`should return the instance of FileLogMailSender when the driver is file_log`, () => {
      mockGetMailDriver(MailDriver.fileLog);
      const instance = Mailer.getInstance();
      expect(instance instanceof FileLogMailSender).toBeTruthy();
    });

    it(`should return the same instance`, () => {
      const instance1 = Mailer.getInstance();
      const instance2 = Mailer.getInstance();
      expect(instance1).toBe(instance2);
    });

    const mockGetMailDriver = (driver: MailDriver | undefined) => {
      getMailDriverStub = sinon.stub(mailUtilities, 'getMailDriver');
      getMailDriverStub.callsFake(jest.fn().mockReturnValue(driver));
    };
  });
});
