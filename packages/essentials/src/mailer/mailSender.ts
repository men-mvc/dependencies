import { SendMailOptions } from './types';

export interface MailSender {
  send(data: SendMailOptions): Promise<void>;
}
