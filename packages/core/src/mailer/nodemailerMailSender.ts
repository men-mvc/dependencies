import nodemailer from 'nodemailer';
import { BaseConfig, config } from '@men-mvc/config';
import { SendMailOptions, TransportOptions } from './types';
import { MailSender } from './mailSender';

// exposing the function just to be able to mock in the test.
export const getConfig = (): BaseConfig => config;

export class NodemailerMailSender implements MailSender {
  // public so that this can be reset in the test.
  public static transportOptions: TransportOptions | null;

  _getTransportOptions = (): TransportOptions => {
    if (NodemailerMailSender.transportOptions) {
      return NodemailerMailSender.transportOptions;
    }
    const appConfig = getConfig();
    console.log(appConfig);
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
    const message: nodemailer.SendMailOptions = {
      from: this._getTransportOptions().auth.user,
      to: data.to,
      subject: data.subject,
      html: data.body
    };
    if (data.attachments && data.attachments.length > 0) {
      message.attachments = data.attachments;
    }
    await this.getTransporter().sendMail(message);
  };
}
