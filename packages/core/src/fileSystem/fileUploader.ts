import { Request } from 'express';
import path from 'path';
import _ from 'lodash';
import {
  UploadedFile as OriginalUploadedFile,
  FileArray
} from 'express-fileupload';
import {
  IFileUploader,
  InvalidPayloadFormatException,
  StoreFileParams,
  StoreFilesParams,
  UploadedFile,
  UploadMaxFileSizeException
} from './types';
import { DeepPartial } from '../types';
import { LocalStorage } from './localStorage';
import { getAppStorageDirectory, isNumber } from '../utilities';
import { generateUuid } from '../utilities/app';
import { getUploadFilesizeLimit } from './utilities';

type SubFieldMetaData = {
  openBracketIndex: number;
  closeBracketIndex: number;
  isArray: boolean;
  subFieldName: string;
};
const OPEN_BRACKET = `[`;
const CLOSE_BRACKET = `]`;
export class FileUploader implements IFileUploader {
  private static tempDirId: string;
  private static storage: LocalStorage;

  // TODO: unit test.
  public getTempUploadDirectory(): string {
    const tempDirectory = path.join(getAppStorageDirectory(), 'temp');

    return path.join(tempDirectory, this.getTempDirId());
  }

  // TODO: unit test.
  public clearTempUploadDirectory = async (): Promise<void> => {
    const tempDir = this.getTempUploadDirectory();
    if (await this.getLocalStorage().exits(tempDir)) {
      await this.getLocalStorage().rmdir(tempDir, true);
    }
  };

  _isPayloadTooLarge = (files: FileArray | null | undefined): boolean => {
    return this._getTotalUploadedFileSize(files) > getUploadFilesizeLimit();
  };

  _getTotalUploadedFileSize = (files: FileArray | null | undefined): number => {
    if (!files) {
      return 0;
    }
    let totalUploadedFileSize: number = 0;
    for (let field in files) {
      const file = files[field];
      if (!file) {
        continue;
      }
      if (Array.isArray(file)) {
        totalUploadedFileSize += _.sum(file.map((f) => f.size));
      } else {
        totalUploadedFileSize += file.size;
      }
    }

    return totalUploadedFileSize;
  };

  public parseFormData = async <T>(req: Request): Promise<DeepPartial<T>> => {
    let fields: { [key: string]: unknown } = {};
    if (req.files) {
      if (Array.isArray(req.files) || typeof req.files !== 'object') {
        // do not support array payload
        throw new InvalidPayloadFormatException();
      }
      if (this._isPayloadTooLarge(req.files)) {
        throw new UploadMaxFileSizeException();
      }

      for (let field in req.files) {
        let fieldValue: UploadedFile | UploadedFile[];
        if (Array.isArray(req.files[field])) {
          fieldValue = (req.files[field] as OriginalUploadedFile[]).map(
            (file) => this._makeUploadedFileCompatible(file)
          );
        } else {
          fieldValue = this._makeUploadedFileCompatible(
            req.files[field] as OriginalUploadedFile
          );
        }
        if (this.isNestedField(field)) {
          const parsedField = this.parseNestedField(field, fieldValue);
          fields = _.merge(fields, parsedField);
        } else {
          fields[field] = fieldValue;
        }
      }
    }
    if (req.body) {
      if (Array.isArray(req.body) || typeof req.body !== 'object') {
        // do not support array payload
        throw new InvalidPayloadFormatException();
      }
      for (let field in req.body) {
        if (this.isNestedField(field)) {
          const parsedField = this.parseNestedField(field, req.body[field]);
          fields = _.merge(fields, parsedField);
        } else {
          fields[field] = req.body[field];
        }
      }
    }

    return fields as T;
  };

  _makeUploadedFileCompatible = (
    originalFile: OriginalUploadedFile
  ): UploadedFile => {
    return new UploadedFile({
      originalFilename: originalFile.name,
      filepath: originalFile.tempFilePath,
      size: originalFile.size,
      mimetype: originalFile.mimetype,
      hash: originalFile.md5
    });
  };

  private isNestedField = (fieldName: string): boolean => {
    const openBracketIndex = fieldName.indexOf(OPEN_BRACKET);
    const closeBracketIndex = fieldName.indexOf(CLOSE_BRACKET);

    return (
      openBracketIndex > -1 &&
      closeBracketIndex > -1 &&
      closeBracketIndex - openBracketIndex > 0
    );
  };

  private buildDestinationDir = (destDir?: string): string => {
    let destDirectory = getAppStorageDirectory();
    if (!destDir) {
      destDir = path.sep;
    }

    return path.join(destDirectory, destDir).toLowerCase();
  };

  // TODO: unit test that rename is called.
  storeFile = async ({
    uploadedFile,
    filename,
    directory
  }: StoreFileParams): Promise<string> => {
    const destDir = this.buildDestinationDir(directory);
    if (!(await this.getLocalStorage().exits(destDir))) {
      await this.getLocalStorage().mkdir(destDir);
    }

    const targetFilepath = this.getTargetFilepath(
      uploadedFile,
      destDir,
      filename
    );
    await this.getLocalStorage().rename(uploadedFile.filepath, targetFilepath);

    return targetFilepath;
  };

  private getTargetFilepath = (
    uploadedFile: UploadedFile,
    destDir: string,
    filename?: string
  ) => {
    const fileExtension = this.getFileExtension(uploadedFile.originalFilename);
    const targetFilename = filename
      ? `${filename}${fileExtension}`.toLowerCase()
      : `${generateUuid()}${fileExtension}`;

    return path.join(destDir, targetFilename);
  };

  storeFiles = async ({
    uploadedFiles,
    directory
  }: StoreFilesParams): Promise<string[]> => {
    const paths: string[] = [];
    for (let i = 0; i < uploadedFiles.length; i++) {
      const path = await this.storeFile({
        uploadedFile: uploadedFiles[i],
        directory
      });
      paths.push(path);
    }

    return paths;
  };

  private getFileExtension = (filepath: string | null) => {
    if (!filepath) {
      return ``;
    }

    return path.extname(filepath).toLowerCase();
  };

  /**
   * // TODO: create a package for this.
   * this function should only be called when isNestedField is true
   */
  private parseNestedField = (fieldName: string, fieldValue: unknown) => {
    if (fieldName[fieldName.length - 1] !== CLOSE_BRACKET) {
      // if the field does not end with ], the payload is invalid
      throw new InvalidPayloadFormatException();
    }
    let subFields: SubFieldMetaData[] = [];
    // get the base field name. For eg: for user[name], base field name would be user.
    const baseFieldName = fieldName.substring(
      0,
      fieldName.indexOf(OPEN_BRACKET)
    );
    if (!baseFieldName) {
      // in other words, if payload is an array
      throw new InvalidPayloadFormatException();
    }
    let openBracketIndex: number = -1;
    let closeBracketIndex: number = -1;
    for (let i = 0; i < fieldName.length; i++) {
      const char = fieldName[i];
      if (char !== OPEN_BRACKET && char !== CLOSE_BRACKET) {
        continue;
      }
      if (char === OPEN_BRACKET) {
        if (openBracketIndex > -1) {
          // found the open bracket again instead of close bracket
          throw new InvalidPayloadFormatException();
        }
        openBracketIndex = i;
        closeBracketIndex = -1; // reset the close bracket index for the new open bracket
      }
      if (char === CLOSE_BRACKET) {
        if (openBracketIndex < 0) {
          // no open bracket found for the close bracket
          throw new InvalidPayloadFormatException();
        }
        closeBracketIndex = i;
      }
      if (openBracketIndex > -1 && closeBracketIndex > -1) {
        const subFieldName = fieldName.substring(
          openBracketIndex + 1,
          closeBracketIndex
        );
        if (!subFieldName) {
          // if there is nothing between [ and ], then the format is invalid.
          throw new InvalidPayloadFormatException();
        }
        subFields.push({
          openBracketIndex,
          closeBracketIndex,
          subFieldName,
          isArray: isNumber(subFieldName)
        });

        openBracketIndex = -1;
        closeBracketIndex = -1;
      }
    }
    let result: { [key: string]: unknown } | unknown = fieldValue;
    subFields = subFields.reverse();
    subFields.map((subField) => {
      if (subField.isArray) {
        // if the existing/ previous value is array, merge two array
        let arrayValue: unknown[] = [];
        arrayValue[Number(subField.subFieldName)] = result;
        result = arrayValue;
      } else {
        result = {
          [subField.subFieldName]: result
        };
      }
    });
    result = {
      [baseFieldName]: result
    };

    return result;
  };

  private getTempDirId = (): string => {
    if (!FileUploader.tempDirId) {
      FileUploader.tempDirId = generateUuid();
    }

    return FileUploader.tempDirId;
  };

  private getLocalStorage = (): LocalStorage => {
    if (!FileUploader.storage) {
      FileUploader.storage = new LocalStorage();
    }

    return FileUploader.storage;
  };
}
