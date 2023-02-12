import { MailAuthType, MailConfig, MailDriver } from '@men-mvc/config';
import { NodemailerMailSender } from './nodemailerMailSender';
/**
 * This is a script to manually test if the emails are sent using different settings (for making local development easier).
 * Run `ts-node sendTestEmail.ts`
 */

/**
 * This is for testing login auth type using mailtrap
 * return this object in the getMailConfig function in the nodemailerMailSender.ts file.
 * TODO: set the credentials
 */
const loginAuthMailConfig: MailConfig = {
  driver: MailDriver.mail,
  host: `sandbox.smtp.mailtrap.io`,
  port: 25,
  user: `xxx`,
  password: `xxx`,
  authType: MailAuthType.Login
};

/**
 * This is for Gmail OAuth2
 * TODO: set the credentials - follow the link below for getting the credentials in the Google Developer console.
 * https://dev.to/chandrapantachhetri/sending-emails-securely-using-node-js-nodemailer-smtp-gmail-and-oauth2-g3a
 * - create a project in the Google Developer console
 * - Select the created project
 * - Navigate to API & Services section -> then go to Credentials section
 * - Create new credentials - Create Credentials -> OAuth Client ID -> Configure Consent Screen -> User Type is External -> Fill up the form (OAuth Consent Screen)
 * - The rest of the steps can be default (just click Save & Continue) -> Back to Dashboard
 * - Then go to Credentials again -> Create Credentials Again (This time selecting Web Application Type) -> OAuth Client ID (this time you will get client ID and secret - keep it somewhere)
 * - Don't forget to register https://developers.google.com/oauthplayground in the Authorized Redirect URIs section
 * - We also need refresh token and access token. For that
 * - Go to -> https://developers.google.com/oauthplayground -> Click the gear icons and check use your own credentials box -> put in client ID and secret
 * - On the left, under the Select & authorize APIs section, find Gmail API v1 and select https://mail.google.com/
 * - Last thing to do is - go back to edit App consent screen. Then register a tester using your email
 */
const gmailOAuth2Config: MailConfig = {
  driver: MailDriver.mail,
  authType: MailAuthType.OAuth2,
  user: `test@gmail.com`,
  accessToken: `xxx`,
  refreshToken: `xxx`,
  clientId: `xxx`,
  clientSecret: `xxx`
};

let mailer = new NodemailerMailSender();
mailer.send({
  to: `test@gmail.com`, //TODO: replace with your test email
  body: `Test email content.`,
  subject: `Test subject`
});
