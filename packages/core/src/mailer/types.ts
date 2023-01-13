export type MailAttachment = {
  filename: string;
  path: string;
};

export type SendMailOptions = {
  to: string;
  subject: string;
  body: string;
  attachments?: MailAttachment[];
};
