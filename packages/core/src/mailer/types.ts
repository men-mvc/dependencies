export type MailAttachment = {
  filename: string;
  path: string;
};

export type SendMailOptions = {
  to: string | string[];
  subject: string;
  body: string;
  attachments?: MailAttachment[];
};

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
