import { baseConfig } from '@men-mvc/config';

// export const getAwsS3Bucket = (): string => baseConfig.fileSystem.s3?.bucket ?? ``;
export const getAwsS3Bucket = (): string => `men-mvc-local`;

export const getAwsS3Credentials = () => ({
  region: `eu-west-2`,
  accessKeyId: `AKIAYKM4VUKOA7X64F5W`,
  secretAccessKey: `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`
});

// export const getAwsS3Credentials = () => ({
//   region: baseConfig.fileSystem?.s3?.region,
//   accessKeyId: baseConfig.fileSystem?.s3?.accessKeyId??``,
//   secretAccessKey: baseConfig.fileSystem?.s3?.secretAccessKey??``
// });
