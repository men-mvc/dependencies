import { NodemailerMailSender } from './nodemailerMailSender';
import { MailSender } from './mailSender';

export class Mailer {
  private static instance: MailSender | null;
  public static getInstance = (): MailSender => {
    if (!Mailer.instance) {
      Mailer.instance = new NodemailerMailSender();
    }

    return Mailer.instance;
  };

  public static resetInstance = () => {
    Mailer.instance = null;
  };
}
