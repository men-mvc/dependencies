import nodemailer from 'nodemailer';
import { config, MailAuthType, MailConfig, MailDriver } from '@men-mvc/config';
import {
  CommonTransportOptions,
  isHtmlSendMailOptions,
  isTemplateSendMailOptions,
  LoginTransportOptions,
  OAuth2TransportOptions,
  SendMailOptions,
  TransportOptions
} from './types';
import { MailSender } from './mailSender';
import { MailTemplateBuilder } from './mailTemplateBuilder';

// exposing the function just to be able to mock in the test.
export const getMailConfig = (): MailConfig => config.mail;

//https://nodemailer.com/smtp/customauth/ for custom auth/
// TODO: custom auth method support.
/**
 * {
 *   auth: {
 *      type: "CUSTOM",
 *      method: "MY-CUSTOM-METHOD",
 *      pass: "xxxx",
 *      user: "xxxx",
 *      options: {
 *          clientId: 'verysecret',
 *          applicationId: 'my-app'
 *     }
 *   },
 *   customAuth: {
 *     "MY-CUSTOM-METHOD": context => {
 *
 *      }
 *   },
 * }
 */

export class NodemailerMailSender implements MailSender {
  // public so that this can be reset in the test.
  public static transportOptions: TransportOptions | null;
  private templateBuilder: MailTemplateBuilder =
    MailTemplateBuilder.getInstance();

  getCommonTransportOptions = (): CommonTransportOptions => {
    const mailConfig = getMailConfig();

    return {
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      service: mailConfig.service,
      tls: {
        ciphers: mailConfig.tlsCiphers,
        rejectUnauthorized: mailConfig.tlsRejectUnauthorized
      }
    };
  };

  getOAuth2TransportOptions = (): OAuth2TransportOptions => {
    const mailConfig = getMailConfig();
    const commonOptions = this.getCommonTransportOptions();

    return {
      ...commonOptions,
      auth: {
        type: MailAuthType.OAuth2,
        user: mailConfig.user,
        pass: mailConfig.password,
        clientId: mailConfig.clientId,
        clientSecret: mailConfig.clientSecret,
        refreshToken: mailConfig.refreshToken,
        accessToken: mailConfig.accessToken,
        expires: mailConfig.expires
      }
    };
  };

  getLoginTransportOptions = (): LoginTransportOptions => {
    const mailConfig = getMailConfig();
    const commonOptions = this.getCommonTransportOptions();

    return {
      ...commonOptions,
      auth: {
        user: mailConfig.user,
        pass: mailConfig.password ?? ``
      }
    };
  };

  _getTransportOptions = (): TransportOptions => {
    if (NodemailerMailSender.transportOptions) {
      return NodemailerMailSender.transportOptions;
    }
    const mailConfig = getMailConfig();
    let transportOptions: TransportOptions;
    if (mailConfig.authType?.toLowerCase() === 'oauth2') {
      transportOptions = this.getOAuth2TransportOptions();
    } else {
      // login - default
      transportOptions = this.getLoginTransportOptions();
    }
    NodemailerMailSender.transportOptions = transportOptions;

    return NodemailerMailSender.transportOptions;
  };

  private getTransporter = (): nodemailer.Transporter =>
    nodemailer.createTransport(this._getTransportOptions());

  public send = async (data: SendMailOptions): Promise<void> => {
    let html = ``;
    if (isTemplateSendMailOptions(data)) {
      html = this.templateBuilder.build(
        data.template.view,
        data.template.data ?? null,
        data.template.layout
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
