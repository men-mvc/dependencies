import { baseConfig, MailDriver } from '@men-mvc/config';

export const getMailDriver = (): MailDriver | undefined => baseConfig.mail.driver;

export const isOAuth2AuthType = (): boolean =>
    baseConfig.mail.authType?.toLowerCase() === 'oauth2';

export const isLoginAuthType = (): boolean =>
    baseConfig.mail.authType?.toLowerCase() === 'login' || !baseConfig.mail.authType; // default.

// TODO: add custom method auth type
