import { BaseConfig, baseConfig } from '@men-mvc/config';

export const getBaseConfig = (): BaseConfig => baseConfig;

export const getAwsS3Bucket = (): string =>
  getBaseConfig().fileSystem.s3?.bucket ?? ``;

export const getAwsS3Credentials = () => ({
  region: getBaseConfig().fileSystem?.s3?.region ?? ``,
  accessKeyId: getBaseConfig().fileSystem?.s3?.accessKeyId ?? ``,
  secretAccessKey: getBaseConfig().fileSystem?.s3?.secretAccessKey ?? ``
});

export const getCloudFrontDomain = (): string => {
  const configDomain =
    getBaseConfig().fileSystem?.s3?.cloudfront?.domainName ?? ``;
  if (!configDomain) {
    return ``;
  }

  const domain = configDomain.startsWith(`http`)
    ? configDomain
    : `https://${configDomain}`;

  return domain.endsWith('/') ? domain.slice(0, -1) : domain;
};

export const getMaxRetryAttempts = (): number =>
  getBaseConfig().fileSystem?.s3?.maxRetryAttempts ?? 3;

export const getRetryMode = (): string | undefined =>
  getBaseConfig().fileSystem?.s3?.retryMode;

const getPrivateKeyString = (): string =>
  getBaseConfig().fileSystem?.s3?.cloudfront?.privateKeyString ?? ``;

export const getCloudFrontConfig = () => ({
  domainName: getCloudFrontDomain(),
  publicKeyId: getBaseConfig().fileSystem?.s3?.cloudfront?.publicKeyId ?? ``,
  privateKeyString: getBaseConfig().fileSystem?.s3?.cloudfront?.privateKeyString
    ? getPrivateKeyString()
    : ``,
  signedUrlDurationInSeconds:
    getBaseConfig().fileSystem?.s3?.cloudfront?.signedUrlDurationInSeconds
});

export const getNow = () => {
  return new Date();
};

/**
 * @returns - duration in seconds
 */
export const getSignedUrlExpireTime = (
  durationInSeconds: number = 0
): number => {
  const toMilliseconds = (value: number) => value * 1000;

  if (durationInSeconds) {
    return getNow().getTime() + toMilliseconds(durationInSeconds);
  }
  const config = getCloudFrontConfig();

  let resultDurationInSeconds = 3600; // 1 hour by default
  if (config.signedUrlDurationInSeconds) {
    resultDurationInSeconds = config.signedUrlDurationInSeconds;
  }

  return getNow().getTime() + toMilliseconds(resultDurationInSeconds);
};
