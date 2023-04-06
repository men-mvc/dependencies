import sinon, { SinonStub } from 'sinon';
import path from 'path';
import {
  clearCachedMailLogsDirname,
  getMailLogsDir,
  getServerDirectory,
  setServerDirectory,
  getMailTemplatesDir
} from '../../../src';
import * as foundationUtilities from '../../../src/utilities/foundation';

const serverDirectoryBeforeTests = getServerDirectory();

describe(`Mail Utilities`, () => {
  afterEach(() => {
    setServerDirectory(serverDirectoryBeforeTests);
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
});
