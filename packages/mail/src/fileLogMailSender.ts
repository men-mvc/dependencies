import path from 'path';
import fs from 'fs';
import { MailSender } from './mailSender';
import { SendMailOptions } from './types';

export const mailLogDirectory = `${process.cwd()}${path.sep}mailLogs`;

/**
 * ! this driver should be used for local development only.
 * ! using sync IO functions as this class is supposed to be used for local development only
 */
export class FileLogMailSender implements MailSender {
  constructor() {
    /**
     * create the mailLogDirectory if the directory does not exist.
     */
    if (!fs.existsSync(mailLogDirectory)) {
      fs.mkdirSync(mailLogDirectory);
    }
  }

  public send = async (data: SendMailOptions): Promise<void> => {
    const logFile = `${new Date().toISOString().split('T')[0]}.txt`;
    const logFilepath = `${mailLogDirectory}${path.sep}${logFile}`;
    const logData = `${new Date().toISOString()}\n${JSON.stringify(
      data
    )}\n\n\n`;
    if (!fs.existsSync(logFilepath)) {
      fs.openSync(logFilepath, 'w');
    }
    fs.appendFileSync(logFilepath, logData);
  };
}
