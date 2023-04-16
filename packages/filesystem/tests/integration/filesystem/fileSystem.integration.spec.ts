import path from 'path';
import sinon from 'sinon';
import { faker } from '@faker-js/faker';
import _ from 'lodash';
import supertest from 'supertest';
import fs from 'fs';
import {
  ErrorCodes,
  DeepPartial,
  setServerDirectory
} from '@men-mvc/foundation';
import { FakeUploadedFile, makePostFormDataRequest } from '@men-mvc/test';
import {
  getTestExpressApp,
  initTestApplication,
  resetTestExpressApp
} from '../utilities';
import { ComplexFormData, SimpleFormData } from './support/types';
import {
  getPrivateStorageDirectory,
  getStorageDirectory,
  fileSystem,
  FileSystem
} from '../../../src';
import { delay, deleteStorageDirectory } from '../../testUtilities';
import {
  generateSimpleFormDataPayload,
  makeFormDataRequest
} from './utilities';
import * as utilities from '../../../src/utilities/utilities';

type StoreFilePayload = {
  file: FakeUploadedFile;
  filename?: string;
  directory?: string;
};
type StoreFilesPayload = {
  files: FakeUploadedFile;
  directory?: string;
};

const tempDirname = `temp`;
/**
 * where the files to be uploaded are stored in
 */
const originalFilesDir = path.join(
  __dirname,
  `support${path.sep}files${path.sep}original`
);
describe('FileSystem', () => {
  let testTempStorageDir: string;

  beforeAll(async () => {
    setServerDirectory(process.cwd());
    testTempStorageDir = path.join(getStorageDirectory(), tempDirname);
    await initTestApplication();
  });

  afterAll(() => {
    setServerDirectory('');
  });

  afterEach(() => {
    fileSystem.resetTempUploadDirId();
    deleteStorageDirectory();
  });

  describe(`parseFormData`, () => {
    it(`should parse complex form data with nested fields`, async () => {
      const formData = generateComplexFormDataPayload();
      const { body } = await makeFormDataRequest(formData);
      const result = body.data as ComplexFormData;

      expect(result.name).toBe(formData.name);
      expect(result.age).toBe(formData.age.toString());
      expect(result.emails.length).toBe(2);
      for (let i = 0; i < result.emails.length; i++) {
        expect(result.emails[i]).toBe(formData.emails[i]);
      }
      expect(result.photoFile.originalFilename).toBe(
        path.basename(formData.photoFile.mockFile as string)
      );
      expect(result.additionalDocs.length).toBe(2);
      const expectedAdditionalDocsPaths = formData.additionalDocs
        .mockFile as string[];
      for (let i = 0; i < result.additionalDocs.length; i++) {
        expect(result.additionalDocs[i].originalFilename).toBe(
          path.basename(expectedAdditionalDocsPaths[i])
        );
      }
      expect(result.address.line).toBe(formData[`address[line]`]);
      expect(result.address.city).toBe(formData[`address[city]`]);
      expect(result.address.postcode).toBe(formData[`address[postcode]`]);
      expect(result.additionalDetails.length).toBe(3);

      // additional details 1
      expect(result.additionalDetails[0].description).toBe(
        formData['additionalDetails[0][description]']
      );
      expect(result.additionalDetails[0].tags.length).toBe(3);
      expect(result.additionalDetails[0].tags[0]).toBe(
        formData[`additionalDetails[0][tags][0]`]
      );
      expect(result.additionalDetails[0].tags[1]).toBe(
        formData[`additionalDetails[0][tags][1]`]
      );
      expect(result.additionalDetails[0].tags[2]).toBe(
        formData[`additionalDetails[0][tags][2]`]
      );
      expect(result.additionalDetails[0].files.length).toBe(2);
      expect(result.additionalDetails[0].files[0].description).toBe(
        formData[`additionalDetails[0][files][0][description]`]
      );
      expect(result.additionalDetails[0].files[0].file.originalFilename).toBe(
        `dummy-doc-3.pdf`
      );
      expect(result.additionalDetails[0].files[1].description).toBe(
        formData[`additionalDetails[0][files][1][description]`]
      );

      // additional details 2
      expect(result.additionalDetails[0].files[1].file.originalFilename).toBe(
        `react.png`
      );

      expect(result.additionalDetails[1].description).toBe(
        formData[`additionalDetails[1][description]`]
      );
      expect(result.additionalDetails[1].files).toBeUndefined();
      expect(result.additionalDetails[1].tags.length).toBe(1);
      expect(result.additionalDetails[1].tags[0]).toBe(
        formData[`additionalDetails[1][tags][0]`]
      );

      // additional details 3
      expect(result.additionalDetails[2].description).toBe(
        formData['additionalDetails[2][description]']
      );
      expect(result.additionalDetails[2].tags.length).toBe(2);
      expect(result.additionalDetails[2].tags[0]).toBe(
        formData['additionalDetails[2][tags][0]']
      );
      expect(result.additionalDetails[2].tags[1]).toBe(
        formData['additionalDetails[2][tags][1]']
      );
      expect(result.additionalDetails[2].files.length).toBe(2);
      expect(result.additionalDetails[2].files[0].description).toBe(
        formData[`additionalDetails[2][files][0][description]`]
      );
      expect(result.additionalDetails[2].files[0].file.originalFilename).toBe(
        `node.png`
      );
      expect(result.additionalDetails[2].files[1].description).toBe(
        formData[`additionalDetails[2][files][1][description]`]
      );
      expect(result.additionalDetails[2].files[1].file.originalFilename).toBe(
        `dummy-doc-1.pdf`
      );
    });

    it(`should delete the unique temp upload dir when the request finished`, async () => {
      resetTestExpressApp();
      const fakeTempDirPath = path.join(
        getStorageDirectory(),
        `temp`,
        `fake-temp-dir-id`
      );
      const getAbsoluteTempUploadDirPathStub = sinon
        .stub(
          (FileSystem.getInstance() as FileSystem).getUploaderInstance(),
          `getAbsoluteTempUploadDirPath`
        )
        .returns(fakeTempDirPath);
      const formData = generateSimpleFormDataPayload();
      const { body } = await makeFormDataRequest(formData);
      expect(fs.existsSync(fakeTempDirPath)).toBeTruthy();
      const result = body.data as SimpleFormData;
      expect(result.name).toBe(formData.name);
      expect(result.photoFile.originalFilename).toBe(`node.png`); // will be one as deleting the unique temp dir is async
      await delay(1000); // wait for request finished event to finish
      expect(fs.existsSync(fakeTempDirPath)).toBeFalsy();
      getAbsoluteTempUploadDirPathStub.restore();
    });

    it(`should create temp storage for request`, async () => {
      if (fs.existsSync(getStorageDirectory())) {
        deleteStorageDirectory();
      }
      const formData = generateSimpleFormDataPayload();
      await makeFormDataRequest(formData);
      expect(fs.existsSync(testTempStorageDir)).toBeTruthy();
    });

    it(`should throw invalid payload format error when fields payload is array`, async () => {
      const result = await makeFormDataRequest({
        [`[0][user][name]`]: faker.name.fullName(),
        [`[1][user][name]`]: faker.name.fullName()
      });

      assertInvalidPayloadFormatError(result);
    });

    it(`should throw invalid payload format error when files payload is array`, async () => {
      const result = await makeFormDataRequest({
        [`[0][photo][file]`]: new FakeUploadedFile(
          path.join(originalFilesDir, `react.png`)
        )
      });

      assertInvalidPayloadFormatError(result);
    });

    it(`should throw invalid payload format error when the field name does not end with the closing bracket`, async () => {
      const result = await makeFormDataRequest({
        [`user[info]name`]: faker.name.fullName()
      });

      assertInvalidPayloadFormatError(result);
    });

    it(`should throw invalid payload format error when field name does not have closing bracket but for opening`, async () => {
      const result = await makeFormDataRequest({
        [`user[info[firstName]`]: faker.name.firstName(),
        [`user[info][lastName]`]: faker.name.lastName()
      });

      assertInvalidPayloadFormatError(result);
    });

    it(`should throw invalid payload format error when there is another open bracket before closing bracket`, async () => {
      const result = await makeFormDataRequest({
        [`user[info][[firstName]`]: faker.name.firstName(),
        [`user[info][lastName]`]: faker.name.lastName()
      });

      assertInvalidPayloadFormatError(result);
    });

    it(`should throw invalid payload format error when array is missing index`, async () => {
      const result = await makeFormDataRequest({
        [`posts[0][tags][]`]: faker.lorem.word(),
        [`posts[1][tags][]`]: faker.lorem.word()
      });

      assertInvalidPayloadFormatError(result);
    });

    it(`should throw invalid payload format error when no open bracket found for closing bracket`, async () => {
      const result = await makeFormDataRequest({
        [`posts[0][tags]]`]: faker.lorem.word(),
        [`posts[1][tags]`]: faker.lorem.word()
      });

      assertInvalidPayloadFormatError(result);
    });

    const assertInvalidPayloadFormatError = (result: supertest.Response) => {
      expect(result.body.error).not.toBeUndefined();
      expect(result.body.error.name).toBe(ErrorCodes.INVALID_PAYLOAD_FORMAT);
    };

    const generateComplexFormDataPayload = () => ({
      name: faker.name.fullName(),
      age: faker.datatype.number(2),
      emails: [faker.internet.email(), faker.internet.email()],
      photoFile: new FakeUploadedFile(path.join(originalFilesDir, `node.png`)),
      additionalDocs: new FakeUploadedFile([
        path.join(originalFilesDir, `dummy-doc-1.pdf`),
        path.join(originalFilesDir, `dummy-doc-2.pdf`)
      ]),
      'address[line]': faker.address.streetAddress(),
      'address[city]': faker.address.city(),
      'address[postcode]': faker.address.zipCode(),

      // additional details 1
      'additionalDetails[0][description]': faker.lorem.paragraphs(2),
      'additionalDetails[0][tags][0]': faker.lorem.word(),
      'additionalDetails[0][tags][1]': faker.lorem.word(),
      'additionalDetails[0][tags][2]': faker.lorem.word(),
      'additionalDetails[0][files][0][description]': faker.lorem.paragraph(),
      'additionalDetails[0][files][0][file]': new FakeUploadedFile(
        path.join(originalFilesDir, `dummy-doc-3.pdf`)
      ),
      'additionalDetails[0][files][1][description]': faker.lorem.paragraph(1),
      'additionalDetails[0][files][1][file]': new FakeUploadedFile(
        path.join(originalFilesDir, `react.png`)
      ),

      // additional details 2
      'additionalDetails[1][description]': faker.lorem.paragraphs(2),
      'additionalDetails[1][tags][0]': faker.lorem.word(),

      // additional details 3
      'additionalDetails[2][description]': faker.lorem.paragraphs(2),
      'additionalDetails[2][tags][0]': faker.lorem.word(),
      'additionalDetails[2][tags][1]': faker.lorem.word(),
      'additionalDetails[2][files][0][description]': faker.lorem.paragraph(),
      'additionalDetails[2][files][0][file]': new FakeUploadedFile(
        path.join(originalFilesDir, `node.png`)
      ),
      'additionalDetails[2][files][1][description]': faker.lorem.paragraph(),
      'additionalDetails[2][files][1][file]': new FakeUploadedFile(
        path.join(originalFilesDir, `dummy-doc-1.pdf`)
      )
    });
  });

  describe(`storeFile`, () => {
    const fakeFilenameUuid = faker.datatype.uuid();
    let generateUuidStub: sinon.SinonStub;
    beforeEach(() => {
      mockGenerateUuid();
    });
    afterEach(async () => {
      generateUuidStub.restore();
    });

    it(`should upload file into the default storage directory generating random filename`, async () => {
      const expectedFilepath = path.join(
        getPrivateStorageDirectory(),
        `${fakeFilenameUuid}.png`
      );
      const { body } = await makeStoreFileRequest(generateStoreFilePayload());

      expect(body.error).toBeFalsy();
      expect(fs.existsSync(expectedFilepath)).toBeTruthy();
    });

    it(`should upload file into the specified directory generating random filename`, async () => {
      const payload = generateStoreFilePayload({
        directory: `/somewhere`
      });
      const { body } = await makeStoreFileRequest(payload);

      expect(body.error).toBeFalsy();
      expect(
        fs.existsSync(
          path.join(
            getPrivateStorageDirectory(),
            payload.directory as string,
            `${fakeFilenameUuid}.png`
          )
        )
      ).toBeTruthy();
    });

    it(`should upload file into the default storage directory with specified name`, async () => {
      const payload = generateStoreFilePayload({
        filename: `/i-am-just-a-file`
      });
      const { body } = await makeStoreFileRequest(payload);

      expect(body.error).toBeFalsy();
      expect(
        fs.existsSync(
          path.join(getPrivateStorageDirectory(), `${payload.filename}.png`)
        )
      ).toBeTruthy();
    });

    it(`should upload file into the specified directory with the specified name`, async () => {
      const payload = generateStoreFilePayload({
        filename: `/i-am-just-a-file`,
        directory: `/i-am-a-dir`
      });
      const { body } = await makeStoreFileRequest(payload);

      expect(body.error).toBeFalsy();
      expect(
        fs.existsSync(
          path.join(
            getPrivateStorageDirectory(),
            payload.directory as string,
            `${payload.filename}.png`
          )
        )
      ).toBeTruthy();
    });

    const makeStoreFileRequest = async (payload: StoreFilePayload) =>
      makePostFormDataRequest(
        await getTestExpressApp(),
        `/fileSystem/storeFile`,
        payload
      );

    const generateStoreFilePayload = (
      data: Partial<StoreFilePayload> = {}
    ): StoreFilePayload => {
      const defaultData: StoreFilePayload = {
        file: new FakeUploadedFile(path.join(originalFilesDir, `node.png`))
      };

      return {
        ...defaultData,
        ...data
      };
    };

    const mockGenerateUuid = () => {
      generateUuidStub = sinon.stub(utilities, `generateUuid`);
      const fakeGenerateUuid = jest
        .fn()
        .mockImplementation(() => fakeFilenameUuid);
      generateUuidStub.callsFake(fakeGenerateUuid);
    };
  });

  describe(`storeFiles`, () => {
    const generatedFilenames = [faker.datatype.uuid(), faker.datatype.uuid()];
    const fakeFilePaths = [
      path.join(originalFilesDir, `node.png`),
      path.join(originalFilesDir, `react.png`)
    ];
    let generateUuidStub: sinon.SinonStub;
    beforeEach(() => {
      mockGenerateUuid();
    });
    afterEach(async () => {
      generateUuidStub.restore();
    });

    it(`should store files into the default storage directory generating random filenames for each file`, async () => {
      const { body } = await makeStoreFilesRequest(generateStoreFilesPayload());

      expect(body.error).toBeFalsy();
      expect(
        fs.existsSync(
          path.join(
            getPrivateStorageDirectory(),
            `${generatedFilenames[0]}.png`
          )
        )
      ).toBeTruthy();
      expect(
        fs.existsSync(
          path.join(
            getPrivateStorageDirectory(),
            `${generatedFilenames[1]}.png`
          )
        )
      ).toBeTruthy();
    });

    it(`should store files into the specified storage directory generating random filenames for each file`, async () => {
      const payload = generateStoreFilesPayload({
        directory: `i-am-a-directory`
      });
      const { body } = await makeStoreFilesRequest(payload);

      expect(body.error).toBeFalsy();
      expect(
        fs.existsSync(
          path.join(
            getPrivateStorageDirectory(),
            payload.directory as string,
            `${generatedFilenames[0]}.png`
          )
        )
      ).toBeTruthy();
      expect(
        fs.existsSync(
          path.join(
            getPrivateStorageDirectory(),
            payload.directory as string,
            `${generatedFilenames[1]}.png`
          )
        )
      ).toBeTruthy();
    });

    const mockGenerateUuid = () => {
      generateUuidStub = sinon.stub(utilities, `generateUuid`);
      generateUuidStub.onCall(0).returns(generatedFilenames[0]);
      generateUuidStub.onCall(1).returns(generatedFilenames[1]);
      generateUuidStub.returns(faker.datatype.uuid());
    };

    const makeStoreFilesRequest = async (payload: StoreFilesPayload) =>
      makePostFormDataRequest(
        await getTestExpressApp(),
        `/fileSystem/storeFiles`,
        payload
      );

    const generateStoreFilesPayload = (
      data: DeepPartial<StoreFilesPayload> = {}
    ): StoreFilesPayload => {
      const defaultData: StoreFilesPayload = {
        files: new FakeUploadedFile(fakeFilePaths)
      };

      return _.merge(defaultData, data);
    };
  });
});
