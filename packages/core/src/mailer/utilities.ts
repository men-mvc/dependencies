import fs from 'fs';
import path from 'path';
import util from 'util';
import { config, MailDriver } from '@men-mvc/config';
import handlebars from 'handlebars';
import { getSourceCodeDirectory } from '../utilities/app';

let emailTemplatesDir: string;
const readFileAsync = util.promisify(fs.readFile);

export const getMailDriver = (): MailDriver | undefined => config.mail.driver;

/**
 * TODO - create a dedicate class for mail templating logic
 * TODO: - unit tests for mail templating functions
 * TODO: reusable views/ components for email template.
 */

export const getEmailTemplatesDir = () => {
  if (emailTemplatesDir) {
    return emailTemplatesDir;
  }
  emailTemplatesDir = path.join(getSourceCodeDirectory(), 'views', 'emails');

  return emailTemplatesDir;
};

// TODO: modify to use the layout file.
// TODO: add useLayout flag and layout prop (for overriding layout file.)
// TODO: this function will be used for just getting the partial view content. Pass the outcome of this function to the layout page as variable.
const getEmailTemplate = async (
  templateView: string
): Promise<handlebars.TemplateDelegate> => {
  // TODO: remove leading fore-slash and write unit test.
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

// TODO: use decorator pattern for with layout
// TODO: test
export const withLayout = async (html: string, layout: string = 'layout') => {
  const finalHtml = await buildEmailBodyFromTemplate(layout, {
    content: html
  });

  return finalHtml;
};

/**
 * @param template - email template filename without .handlebars extension
 */
export const getPartialViewNameForTemplate = (template: string): string => {
  if (template.startsWith('/')) {
    template = template.slice(1);
  }
  if (template.startsWith(path.sep)) {
    template = template.slice(1);
  }

  return template.replace(path.sep, '_').replace('/', '_').replace('-', '_');
};
