import util from 'util';
import { MailSender } from './mailSender';
import { SendMailOptions } from './types';

export class ConsoleLogMailSender implements MailSender {
  public send = async (options: SendMailOptions): Promise<void> => {
    console.log(util.inspect(options, false, null, true));
  };
}
