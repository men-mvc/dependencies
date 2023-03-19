import handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';
import { getSourceCodeDirectory } from '../utilities';

type TemplateData = { [key: string]: unknown };

interface AbstractTemplateCompiler {
  compile: (
    templateBuilder: MailTemplateBuilder,
    template: string,
    data: TemplateData
  ) => string;
}

class TemplateCompiler implements AbstractTemplateCompiler {
  public compile = (
    templateBuilder: MailTemplateBuilder,
    template: string,
    data: TemplateData
  ): string => {
    return templateBuilder.getTemplateHtml(template, data);
  };
}

class LayoutDecorator implements AbstractTemplateCompiler {
  constructor(private templateCompiler: AbstractTemplateCompiler) {}

  public compile = (
    templateBuilder: MailTemplateBuilder,
    template: string,
    data: TemplateData
  ): string => {
    const templateHtml = this.templateCompiler.compile(
      templateBuilder,
      template,
      data
    );

    return templateBuilder.build('layout', {
      content: templateHtml
    }); // template + layout html
  };
}

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
    data: TemplateData | null,
    layout?: string
  ): string => {
    let compiler = new TemplateCompiler();
    if (layout) {
      compiler = new LayoutDecorator(compiler);
    }

    return compiler.compile(this, template, data ?? {});
  };

  public getTemplateHtml = (template: string, data: TemplateData): string => {
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
