import fs from 'fs';
import path from 'path';
import util from 'util';
import { config, MailDriver } from '@men-mvc/config';
import handlebars from 'handlebars';

let emailTemplatesDir: string;
const readFileAsync = util.promisify(fs.readFile);

export const getMailDriver = (): MailDriver | undefined => config.mail.driver;

export const getEmailTemplatesDir = () => {
  if (emailTemplatesDir) {
    return emailTemplatesDir;
  }
  emailTemplatesDir = path.join(process.cwd(), 'views', 'emails');

  return emailTemplatesDir;
};

// reference -> https://alexanderpaterson.com/posts/use-handlebars-to-send-great-emails-from-node-applications
const getEmailTemplate = async (
  templateView: string
): Promise<handlebars.TemplateDelegate> => {
  /**
   * ! does not create the directory (views/emails) if it does not exist as the developer is responsible for creating the folder.
   */
  const sourceFileBuffer = await readFileAsync(
    `${getEmailTemplatesDir()}${path.sep}${templateView}.handlebars`
  );
  return handlebars.compile(sourceFileBuffer.toString());
};

export const buildEmailBodyFromTemplate = async (
  templateView: string,
  data: { [key: string]: unknown } = {}
): Promise<string> => {
  const template = await getEmailTemplate(templateView);

  return template(data);
};
