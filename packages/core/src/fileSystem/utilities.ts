import { config } from '@men-mvc/config';

export const getUploadFilesizeLimit = (): number =>
  config.fileSystem.maxUploadLimit;
