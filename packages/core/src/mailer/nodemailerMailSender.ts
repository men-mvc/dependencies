import nodemailer from 'nodemailer';
import { config } from '@men-mvc/config';
import { SendMailOptions } from './types';
import { MailSender } from './mailSender';

export class NodemailerMailSender implements MailSender {
  private getClient = (): nodemailer.Transporter => {
    return nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: true, // TODO: there should be a way to override this flag
      auth: {
        user: config.mail.address,
        pass: config.mail.password
      },
      service: config.mail.service
    });
  };

  public send = async (data: SendMailOptions): Promise<void> => {
    const message: nodemailer.SendMailOptions = {
      from: config.mail.address,
      to: data.to,
      subject: data.subject,
      html: data.body
    };
    if (data.attachments && data.attachments.length > 0) {
      message.attachments = data.attachments;
    }
    await this.getClient().sendMail(message);
  };
}
