import nodemailer from 'nodemailer';
import { BaseConfig, config } from '@men-mvc/config';
import handlebars from 'handlebars';
import {
  isHtmlSendMailOptions,
  isTemplateSendMailOptions,
  SendMailOptions,
  TransportOptions
} from './types';
import { MailSender } from './mailSender';
import { buildEmailBodyFromTemplate } from './utilities';

// exposing the function just to be able to mock in the test.
export const getConfig = (): BaseConfig => config;

// TODO: add support for PLAIN, LOGIN and CRAM-MD5 auth types
export class NodemailerMailSender implements MailSender {
  // public so that this can be reset in the test.
  public static transportOptions: TransportOptions | null;

  _getTransportOptions = (): TransportOptions => {
    if (NodemailerMailSender.transportOptions) {
      return NodemailerMailSender.transportOptions;
    }
    const appConfig = getConfig();
    NodemailerMailSender.transportOptions = {
      host: appConfig.mail.host,
      port: appConfig.mail.port,
      secure: appConfig.mail.secure,
      auth:
        appConfig.mail.authType === 'OAuth2'
          ? {
              type: 'OAuth2',
              user: appConfig.mail.user,
              clientId: appConfig.mail.clientId,
              clientSecret: appConfig.mail.clientSecret,
              refreshToken: appConfig.mail.refreshToken,
              accessToken: appConfig.mail.accessToken,
              expires: appConfig.mail.expires
            }
          : {
              user: appConfig.mail.user,
              pass: appConfig.mail.password
            },
      service: appConfig.mail.service,
      tls: {
        ciphers: appConfig.mail.tlsCiphers
      }
    };

    return NodemailerMailSender.transportOptions;
  };

  private getTransporter = (): nodemailer.Transporter => {
    return nodemailer.createTransport(this._getTransportOptions());
  };

  public send = async (data: SendMailOptions): Promise<void> => {
    let html = ``;
    if (isTemplateSendMailOptions(data)) {
      html = await buildEmailBodyFromTemplate(
        data.template.view,
        data.template.data
      );
    } else if (isHtmlSendMailOptions(data)) {
      html = data.body;
    }
    const message: nodemailer.SendMailOptions = {
      from: this._getTransportOptions().auth.user,
      to: data.to,
      subject: data.subject,
      html
    };
    if (data.attachments && data.attachments.length > 0) {
      message.attachments = data.attachments;
    }
    await this.getTransporter().sendMail(message);
  };
}
