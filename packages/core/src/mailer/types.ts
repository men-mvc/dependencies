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
  };
};

export type SendMailOptions = HtmlSendMailOptions | TemplateSendMailOptions;

export const isTemplateSendMailOptions = (
  arg: Record<string, unknown>
): arg is TemplateSendMailOptions =>
  arg['template'] !== undefined &&
  arg['template'] !== null &&
  typeof arg === 'object';

export const isHtmlSendMailOptions = (
  arg: Record<string, unknown>
): arg is HtmlSendMailOptions => !isTemplateSendMailOptions(arg);

export type TransportOptions = {
  host?: string;
  port?: number;
  secure?: boolean;
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
  service?: string;
  tls?: {
    ciphers?: string;
  };
};
