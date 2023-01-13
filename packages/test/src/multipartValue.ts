import fs from 'fs';
type MultipartValueSingle =
  | Blob
  | Buffer
  | fs.ReadStream
  | string
  | boolean
  | number;

export type MultipartValue = MultipartValueSingle | MultipartValueSingle[];
