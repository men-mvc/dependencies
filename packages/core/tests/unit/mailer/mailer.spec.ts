import { Mailer, NodemailerMailSender } from '../../../src';

describe(`Mailer`, () => {
  describe(`getInstance`, () => {
    beforeEach(() => {
      Mailer.resetInstance();
    });

    it(`should return the instance of NodemailerMailerMailSender`, () => {
      const instance = Mailer.getInstance();
      expect(instance instanceof NodemailerMailSender).toBeTruthy();
    });

    it(`should return the same instance`, () => {
      const instance1 = Mailer.getInstance();
      const instance2 = Mailer.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
});
