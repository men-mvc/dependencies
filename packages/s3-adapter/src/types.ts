export type MenS3PutObjectCommandOutput = {
  $metadata: {
    httpStatusCode: number;
    requestId: string;
    cfId?: string;
    attempts: number;
    totalRetryDelay: number;
  };
  ETag: string;
  ServerSideEncryption: string;
  VersionId: string;
};
