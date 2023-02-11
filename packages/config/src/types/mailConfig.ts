import { MailAuthType } from './mailAuthType';
import { MailDriver } from './mailDriver';

export type MailConfig = {
  driver?: MailDriver;
  user: string;
  password: string;
  host?: string;
  port?: number;
  service?: string;
  secure?: boolean;
  authType?: MailAuthType;
  tlsCiphers?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  expires?: number;
};
