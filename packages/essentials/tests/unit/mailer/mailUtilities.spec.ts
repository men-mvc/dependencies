import {
  clearCachedMailLogsDirname,
  getMailLogsDir,
  getServerDirectory,
  setServerDirectory,
  getMailTemplatesDir
} from '../../../src';
import * as utilities from '../../../src/utilities/app';
import sinon, { SinonStub } from 'sinon';
import path from 'path';

const serverDirectoryBeforeTests = getServerDirectory();

describe(`Mail Utilities`, () => {
  afterEach(() => {
    setServerDirectory(serverDirectoryBeforeTests);
  });

  describe(`getMailLogsDir`, () => {
    const mailLogsDirname = `mailLogs`;
    let isInSourceDirectoryStub: SinonStub;

    afterEach(() => {
      if (isInSourceDirectoryStub) {
        isInSourceDirectoryStub.restore();
      }
      clearCachedMailLogsDirname();
    });

    it(`should return sever path + mail logs dirname when it's not running ts source code`, async () => {
      const serverDir = `tests/dist`;
      setServerDirectory(serverDir);
      isInSourceDirectoryStub = sinon
        .stub(utilities, 'isInSourceDirectory')
        .returns(false);
      expect(getMailLogsDir()).toBe(path.join(serverDir, mailLogsDirname));
    });

    it(`should return mail logs dirname name when server dir is empty when running ts source code`, async () => {
      setServerDirectory('');
      isInSourceDirectoryStub = sinon
        .stub(utilities, 'isInSourceDirectory')
        .returns(true);
      expect(getMailLogsDir()).toBe(mailLogsDirname);
    });

    it(`should return server dir without src + mail logs dirname when running ts source code`, async () => {
      setServerDirectory(`tests/src`);
      isInSourceDirectoryStub = sinon
        .stub(utilities, 'isInSourceDirectory')
        .returns(true);
      expect(getMailLogsDir()).toBe(path.join(`tests`, mailLogsDirname));
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
