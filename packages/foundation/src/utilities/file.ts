import mimeTypes from 'mime-types';

export const getMimeType = (filePathOrName: string): string | null => {
  const mimeType = mimeTypes.lookup(filePathOrName);
  return mimeType ? mimeType : null;
};
