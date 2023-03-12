import { baseConfig } from '@men-mvc/config';

export const getAwsS3Bucket = (): string => baseConfig.fileSystem.s3?.bucket ?? ``;

export const getAwsS3Credentials = () => ({
  region: baseConfig.fileSystem?.s3?.region,
  accessKeyId: baseConfig.fileSystem?.s3?.accessKeyId??``,
  secretAccessKey: baseConfig.fileSystem?.s3?.secretAccessKey??``
});
