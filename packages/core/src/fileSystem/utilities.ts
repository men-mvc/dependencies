import { baseConfig } from '@men-mvc/config';

export const getUploadFilesizeLimit = (): number =>
  baseConfig.fileSystem.maxUploadLimit;
