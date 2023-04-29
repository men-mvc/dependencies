import { MailAuthType, MailConfig } from '@men-mvc/config';
import { faker } from '@faker-js/faker';
import { DeepPartial } from '@men-mvc/foundation';
import sinon, { SinonStub } from 'sinon';
import path from 'path';
import {
  clearCachedMailLogsDirname,
  getMailLogsDir,
  getMailTemplatesDir
} from '../../../src';
import {
  getServerDirectory,
  setServerDirectory
} from '../../../src/foundation';
import * as foundationUtilities from '../../../src/foundation';
import * as mailUtilities from '../../../src/utilities';

const serverDirectoryBeforeTests = getServerDirectory();

describe(`Mail Utilities`, () => {
  let getMailConfigStub: SinonStub;

  afterEach(() => {
    setServerDirectory(serverDirectoryBeforeTests);
    if (getMailConfigStub) {
      getMailConfigStub.restore();
    }
  });

  describe(`isOAuth2AuthType`, () => {
    it(`should return true if authType is ${MailAuthType.OAuth2}`, () => {
      getMailConfigStub = sinon.stub(mailUtilities, `getMailConfig`).returns(
        generateMailConfig({
          authType: MailAuthType.OAuth2
        })
      );
      expect(mailUtilities.isOAuth2AuthType()).toBeTruthy();
    });

    it(`should return false if authType is not ${MailAuthType.OAuth2}`, () => {
      getMailConfigStub = sinon.stub(mailUtilities, `getMailConfig`).returns(
        generateMailConfig({
          authType: MailAuthType.Login
        })
      );
      expect(mailUtilities.isOAuth2AuthType()).toBeFalsy();
    });

    it(`should be case insensitive`, () => {
      getMailConfigStub = sinon.stub(mailUtilities, `getMailConfig`).returns(
        generateMailConfig({
          authType: (
            MailAuthType.OAuth2 as string
          ).toUpperCase() as MailAuthType
        })
      );
      expect(mailUtilities.isOAuth2AuthType()).toBeTruthy();
    });
  });

  describe(`isLoginAuthType`, () => {
    it(`should return true if authType is ${MailAuthType.Login}`, () => {
      getMailConfigStub = sinon.stub(mailUtilities, `getMailConfig`).returns(
        generateMailConfig({
          authType: MailAuthType.Login
        })
      );
      expect(mailUtilities.isLoginAuthType()).toBeTruthy();
    });

    it(`should return false if authType is not ${MailAuthType.Login}`, () => {
      getMailConfigStub = sinon.stub(mailUtilities, `getMailConfig`).returns(
        generateMailConfig({
          authType: MailAuthType.OAuth2
        })
      );
      expect(mailUtilities.isLoginAuthType()).toBeFalsy();
    });

    it(`should be case sensitive`, () => {
      getMailConfigStub = sinon.stub(mailUtilities, `getMailConfig`).returns(
        generateMailConfig({
          authType: (MailAuthType.Login as string).toUpperCase() as MailAuthType
        })
      );
      expect(mailUtilities.isLoginAuthType()).toBeTruthy();
    });
  });

  describe(`getMailLogsDir`, () => {
    const mailLogsDirname = `mailLogs`;
    let getAppRootDirectoryStub: SinonStub;

    afterEach(() => {
      clearCachedMailLogsDirname();
      if (getAppRootDirectoryStub) {
        getAppRootDirectoryStub.restore();
      }
    });

    it(`should return app root dir + dirname`, async () => {
      const appRootDir = `tests/app/src`;
      getAppRootDirectoryStub = sinon
        .stub(foundationUtilities, `getAppRootDirectory`)
        .returns(appRootDir);

      expect(getMailLogsDir()).toBe(path.join(appRootDir, mailLogsDirname));
    });
  });

  describe(`getMailTemplatesDir`, () => {
    it(`should return server dir + views + emails`, () => {
      const serverDir = `tests/src`;
      setServerDirectory(serverDir);

      expect(getMailTemplatesDir()).toBe(
        path.join(serverDir, 'views', 'emails')
      );
    });
  });

  const generateMailConfig = (
    config: DeepPartial<MailConfig> = {}
  ): MailConfig => {
    const defaultConfig: MailConfig = {
      user: faker.datatype.uuid(),
      password: faker.datatype.uuid()
    };

    return {
      ...defaultConfig,
      ...config
    };
  };
});
