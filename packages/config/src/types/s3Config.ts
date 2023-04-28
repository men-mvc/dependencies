export type S3Config = {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  retryMode?: string;
  maxRetryAttempts?: number;
  cloudfront?: {
    domainName: string;
    publicKeyId: string;
    privateKeyString: string;
    signedUrlDurationInSeconds?: number;
  };
};
