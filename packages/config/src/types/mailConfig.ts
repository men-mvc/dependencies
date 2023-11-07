import { MailAuthType } from './mailAuthType';
import { MailDriver } from './mailDriver';

export type NodemailerMailConfig = {
  user: string;
  password?: string;
  host?: string;
  port?: number;
  service?: string;
  secure?: boolean;
  authType?: MailAuthType;
  tlsCiphers?: string;
  tlsRejectUnauthorized?: boolean;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  expires?: number;
};

export type SesMailConfig = {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};

export type MailConfig = {
  driver?: MailDriver;
  nodemailer?: NodemailerMailConfig;
  ses?: SesMailConfig;
};
