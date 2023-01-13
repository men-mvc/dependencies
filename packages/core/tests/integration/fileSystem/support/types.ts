import { UploadedFile } from '../../../../src/fileSystem';

// TODO: this support only string. including number array
export type ComplexFormData = {
  name: string;
  age: string;
  emails: string[];
  photoFile: UploadedFile;
  additionalDocs: UploadedFile[];
  address: {
    line: string;
    city: string;
    postcode: string;
  };
  additionalDetails: {
    description: string;
    tags: string[];
    files: {
      description: string;
      file: UploadedFile;
    }[];
  }[];
};

export type SimpleFormData = {
  name: string;
  email: string;
  photoFile: UploadedFile;
  additionalFiles: UploadedFile[];
};

export type StoreFileFormData = {
  file: UploadedFile;
  directory: string;
  filename: string;
};

export type StoreFilesFormData = {
  files: UploadedFile[];
  directory: string;
};
