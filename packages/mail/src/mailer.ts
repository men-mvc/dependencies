import { NodemailerMailSender } from './nodemailerMailSender';
import { MailSender } from './mailSender';
import { ConsoleLogMailSender } from './consoleLogMailSender';
import { FileLogMailSender } from './fileLogMailSender';
import { getMailDriver } from './utilities';

export class Mailer {
  private static instance: MailSender | null;
  public static getInstance = (): MailSender => {
    if (!Mailer.instance) {
      switch (getMailDriver()) {
        case 'file_log': {
          Mailer.instance = new FileLogMailSender();
          break;
        }
        case 'console_log': {
          Mailer.instance = new ConsoleLogMailSender();
          break;
        }
        default: {
          Mailer.instance = new NodemailerMailSender();
          break;
        }
      }
    }

    return Mailer.instance;
  };

  public static resetInstance = () => {
    Mailer.instance = null;
  };
}
