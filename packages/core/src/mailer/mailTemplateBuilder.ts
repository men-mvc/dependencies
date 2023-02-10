import handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';
import { getSourceCodeDirectory } from '../utilities/app';

// TODO: this is the best time to learn decorator pattern
// TODO: use decorator pattern for withLayout
/**
 * template arguments refer to the file names without handlebars extension in views/emails folder.
 * Eg: if the file path is views/emails/welcome.handlebars, the template name is welcome.
 */
export class MailTemplateBuilder {
  private static emailTemplatesDir: string;
  private static instance: MailTemplateBuilder | null;

  constructor() {
    this.initialise();
  }

  public static getInstance = (): MailTemplateBuilder => {
    if (!MailTemplateBuilder.instance) {
      MailTemplateBuilder.instance = new MailTemplateBuilder();
    }

    return MailTemplateBuilder.instance;
  };

  public build = (
    template: string,
    data: { [key: string]: unknown } | null,
    layout?: string
  ): string => {
    let html = this.getTemplateHtml(template, data ?? {}); // TODO: test default empty object
    if (layout) {
      html = this.withLayout(layout, html);
    }

    return html;
  };

  private getTemplateHtml = (
    template: string,
    data: { [key: string]: unknown }
  ): string => {
    const templateDelegate = this.getTemplateDelegate(template);

    return templateDelegate(data);
  };

  private initialise = () => {
    // helper function for including partial templates/ views
    handlebars.registerHelper('include', (template, data) =>
      this.getTemplateHtml(template, data.data.root)
    );
  };

  private getTemplateDir = () => {
    if (MailTemplateBuilder.emailTemplatesDir) {
      return MailTemplateBuilder.emailTemplatesDir;
    }
    MailTemplateBuilder.emailTemplatesDir = path.join(
      getSourceCodeDirectory(),
      'views',
      'emails'
    );

    return MailTemplateBuilder.emailTemplatesDir;
  };

  /**
   * layout is also a template - path to file
   * layout has a content variable in the html. The content variable is replaced with the html of the template
   */
  private withLayout = (layout: string, templateHtml: string): string => {
    return this.getTemplateHtml(layout, {
      content: templateHtml
    });
  };

  private getTemplateDelegate = (
    template: string
  ): handlebars.TemplateDelegate => {
    /**
     * ! does not create the directory (views/emails) if it does not exist as the developer is responsible for creating the folder.
     */
    const sourceFileBuffer = fs.readFileSync(
      `${this.getTemplateDir()}${path.sep}${template}.handlebars`
    );
    return handlebars.compile(sourceFileBuffer.toString());
  };
}
