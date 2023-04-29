import { Mailer } from './mailer';
import { MailSender } from './mailSender';

export const mailer: MailSender = Mailer.getInstance();

export * from './mailer';
export * from './nodemailerMailSender';
export * from './types';
export * from './mailSender';
export * from './utilities';
export * from './consoleLogMailSender';
export * from './fileLogMailSender';
