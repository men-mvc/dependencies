import { config, MailDriver } from '@men-mvc/config';

export const getMailDriver = (): MailDriver | undefined => config.mail.driver;

export const isOAuth2AuthType = (): boolean =>
  config.mail.authType?.toLowerCase() === 'oauth2';

export const isLoginAuthType = (): boolean =>
  config.mail.authType?.toLowerCase() === 'login' || !config.mail.authType; // default.

// TODO: add custom method auth type
