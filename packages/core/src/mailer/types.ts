import { CustomAuthenticationContext } from 'nodemailer/lib/smtp-connection';

export type MailAttachment = {
  filename: string;
  path: string;
};

type SendMailCommonOptions = {
  to: string | string[];
  subject: string;
  attachments?: MailAttachment[];
};

export type HtmlSendMailOptions = SendMailCommonOptions & {
  body: string;
  template?: never;
};

export type TemplateSendMailOptions = SendMailCommonOptions & {
  template: {
    view: string;
    data?: Record<string, unknown>;
    layout?: string;
  };
};

export type SendMailOptions = HtmlSendMailOptions | TemplateSendMailOptions;

export const isTemplateSendMailOptions = (
  sendMailOptions: Record<string, unknown>
): sendMailOptions is TemplateSendMailOptions =>
  sendMailOptions['template'] !== undefined &&
  sendMailOptions['template'] !== null &&
  typeof sendMailOptions === 'object';

export const isHtmlSendMailOptions = (
  sendMailOptions: Record<string, unknown>
): sendMailOptions is HtmlSendMailOptions =>
  !isTemplateSendMailOptions(sendMailOptions);

// TODO: add more transport options types.

type CustomMailAuthContext = CustomAuthenticationContext;

export type CommonTransportOptions = {
  host?: string;
  port?: number;
  secure?: boolean;
  service?: string;
  tls?: {
    ciphers?: string;
  };
};

export type OAuth2TransportOptions = CommonTransportOptions & {
  auth: {
    type?: 'OAuth2';
    user: string;
    pass?: string;
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    accessToken?: string;
    expires?: number;
  };
};

export type LoginTransportOptions = CommonTransportOptions & {
  auth: {
    type?: undefined;
    user: string;
    pass: string;
  };
};

// // TODO:
// export type CustomAuthTransportOptions = CommonTransportOptions & {
//   auth: {
//     type: "CUSTOM",
//     method: string;
//     user: string;
//     pass: string;
//     options: TransportAuthOptions;
//   },
//   customAuth: {
//
//   }
// };

export type TransportOptions = LoginTransportOptions | OAuth2TransportOptions;
