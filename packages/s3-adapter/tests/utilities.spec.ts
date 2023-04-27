import sinon, { SinonSandbox } from 'sinon';
import { S3Config } from '@men-mvc/config';
import * as utilities from '../src/utilities';
import { generateBaseConfig } from './testUtilities';

describe(`S3 Adapter Utilities`, () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`getAwsS3Bucket`, () => {
    it(`should return aws bucket`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            s3: {
              bucket: `test-bucket`
            } as S3Config
          }
        })
      );

      expect(utilities.getAwsS3Bucket()).toBe(`test-bucket`);
    });

    it(`should return empty string`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            s3: undefined
          }
        })
      );

      expect(utilities.getAwsS3Bucket()).toBe(``);
    });
  });

  describe(`getAwsS3Credentials`, () => {
    it(`should return the values specified in the base config`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            s3: {
              bucket: `test-bucket`,
              region: `eu-west-2`,
              accessKeyId: `test-access-key-id`,
              secretAccessKey: `test-secret-access-key`
            }
          }
        })
      );

      const result = utilities.getAwsS3Credentials();
      expect(result.region).toBe(`eu-west-2`);
      expect(result.accessKeyId).toBe(`test-access-key-id`);
      expect(result.secretAccessKey).toBe(`test-secret-access-key`);
    });
  });

  describe(`getCloudFrontDomain`, () => {
    it(`should return empty string if no domain is specified`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            s3: {
              bucket: `test-bucket`
            } as S3Config
          }
        })
      );

      expect(utilities.getCloudFrontDomain()).toBe(``);
    });

    it(`should return cloudfront domain as it when it starts with http`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            s3: {
              bucket: `test-bucket`,
              cloudfront: {
                domainName: `http://test-domain.com`
              }
            } as S3Config
          }
        })
      );

      expect(utilities.getCloudFrontDomain()).toBe(`http://test-domain.com`);
    });

    it(`should prepend https to cloudfront domain when it does not start with http`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            s3: {
              bucket: `test-bucket`,
              cloudfront: {
                domainName: `test-domain.com`
              }
            } as S3Config
          }
        })
      );

      expect(utilities.getCloudFrontDomain()).toBe(`https://test-domain.com`);
    });
  });

  describe(`getCloudFrontConfig`, () => {
    it(`should return the values specified in the base config`, () => {
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            s3: {
              cloudfront: {
                domainName: `http://cloudfront.example.com`,
                publicKeyId: `test-public-key-id`,
                privateKeyString: `test-private-key`,
                signedUrlDurationInSeconds: 987654
              }
            } as S3Config
          }
        })
      );

      const result = utilities.getCloudFrontConfig();

      expect(result.privateKeyString).toBe(`test-private-key`);
      expect(result.domainName).toBe(`http://cloudfront.example.com`);
      expect(result.publicKeyId).toBe(`test-public-key-id`);
      expect(result.signedUrlDurationInSeconds).toBe(987654);
    });
  });

  describe(`getSignedUrlExpireTime`, () => {
    it(`should return duration passed as the argument`, () => {
      const now = new Date();
      sandbox.stub(utilities, `getNow`).returns(now);
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            s3: {
              cloudfront: {
                domainName: `https://cloudfront.example.com`,
                signedUrlDurationInSeconds: 120
              }
            } as S3Config
          }
        })
      );

      expect(utilities.getSignedUrlExpireTime(130)).toBe(
        now.getTime() + 130000
      );
    });

    it(`should return default duration set in the config`, () => {
      const now = new Date();
      sandbox.stub(utilities, `getNow`).returns(now);
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            s3: {
              cloudfront: {
                domainName: `https://cloudfront.example.com`,
                signedUrlDurationInSeconds: 120
              }
            } as S3Config
          }
        })
      );

      expect(utilities.getSignedUrlExpireTime()).toBe(now.getTime() + 120000);
    });

    it(`should return default 1 hour (60000 * 60)`, () => {
      const now = new Date();
      sandbox.stub(utilities, `getNow`).returns(now);
      sandbox.stub(utilities, `getBaseConfig`).returns(
        generateBaseConfig({
          fileSystem: {
            s3: {
              cloudfront: {
                domainName: `https://cloudfront.example.com`
              }
            } as S3Config
          }
        })
      );

      expect(utilities.getSignedUrlExpireTime()).toBe(
        now.getTime() + 60000 * 60
      );
    });
  });
});
