import { config, MailDriver } from '@men-mvc/config';

export const getMailDriver = (): MailDriver | undefined => config.mail.driver;
