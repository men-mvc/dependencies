import fs from 'fs';
import path from 'path';
import {
  FileLogMailSender,
  mailLogDirectory
} from '../../../src/mailer/fileLogMailSender';
import { generateSendMailData } from './utilities';

describe(`FileLogMailSender`, () => {
  afterEach(() => deleteMailLogDirectoryIfExists());

  it(`should create the mailLog directory when the FileLogMailSender instance is created`, () => {
    deleteMailLogDirectoryIfExists();
    new FileLogMailSender();
    expect(fs.existsSync(mailLogDirectory)).toBeTruthy();
  });

  it(`should log mail data in the mailLog directory creating a new log file`, async () => {
    const mailSender = new FileLogMailSender();
    const mailLogFilepath = `${mailLogDirectory}${path.sep}${
      new Date().toISOString().split('T')[0]
    }.txt`;
    const mailData = generateSendMailData();
    await mailSender.send(mailData);
    expect(fs.existsSync(mailLogFilepath)).toBeTruthy();
    const logFileContent = fs.readFileSync(mailLogFilepath).toString();
    expect(logFileContent).toBe(
      `${new Date().toISOString()}\n${JSON.stringify(mailData)}\n\n\n`
    );
  });

  it(`should append the mail data to an existing log file`, async () => {
    const mailSender = new FileLogMailSender();
    const mailLogFilepath = `${mailLogDirectory}${path.sep}${
      new Date().toISOString().split('T')[0]
    }.txt`;
    const mailData1 = generateSendMailData();
    await mailSender.send(mailData1);
    const mailData2 = generateSendMailData();
    await mailSender.send(mailData2);
    const logFileContent = fs.readFileSync(mailLogFilepath).toString();
    expect(logFileContent).toBe(
      `${new Date().toISOString()}\n${JSON.stringify(
        mailData1
      )}\n\n\n${new Date().toISOString()}\n${JSON.stringify(mailData2)}\n\n\n`
    );
  });

  const deleteMailLogDirectoryIfExists = () => {
    if (fs.existsSync(mailLogDirectory)) {
      fs.rmdirSync(mailLogDirectory, {
        recursive: true
      });
    }
  };
});
