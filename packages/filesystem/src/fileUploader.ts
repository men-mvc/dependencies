import { Request } from 'express';
import path from 'path';
import _ from 'lodash';
import {
  FileArray,
  UploadedFile as ExpressUploadedFile
} from 'express-fileupload';
import {
  DeepPartial,
  FileSystemDriver,
  isNumber,
  UploadedFile,
  UploadMaxFileSizeError
} from '@men-mvc/foundation';
import {
  BaseFileUploader,
  InvalidPayloadFormatException,
  MenS3PutObjectCommandOutput,
  StoreFileParams,
  StoreFilesParams
} from './types';
import { LocalStorage } from './localStorage';
import {
  existsAsync,
  generateUuid,
  getDriver,
  getPathInStorage,
  getPublicStorageDirname,
  getUploadFilesizeLimit,
  mkdirAsync,
  readFileAsync,
  renameAsync,
  rmdirAsync,
  unlinkAsync
} from './utilities/utilities';
import { S3Storage } from './s3/s3Storage';

const tempDirname = 'temp';
type SubFieldMetaData = {
  openBracketIndex: number;
  closeBracketIndex: number;
  isArray: boolean;
  subFieldName: string;
};
const OPEN_BRACKET = `[`;
const CLOSE_BRACKET = `]`;
export class FileUploader implements BaseFileUploader {
  private tempDirId: string | undefined;
  private localStorage: LocalStorage | undefined;
  private s3Storage: S3Storage | undefined;

  public getLocalStorage = (): LocalStorage => {
    if (!this.localStorage) {
      this.localStorage = new LocalStorage();
    }

    return this.localStorage;
  };

  public getS3Storage = (): S3Storage => {
    if (!this.s3Storage) {
      this.s3Storage = new S3Storage();
    }

    return this.s3Storage;
  };

  public getAbsoluteTempUploadDirPath(): string {
    const tempDirectory = this.getLocalStorage().getAbsolutePath(tempDirname);
    return path.join(tempDirectory, this._getTempDirId());
  }

  public clearTempUploadDirectory = async (): Promise<void> => {
    try {
      await rmdirAsync(this.getAbsoluteTempUploadDirPath(), {
        recursive: true
      });
      this.resetTempUploadDirId();
    } catch (e) {
      // fail silently intentionally (race condition - clearing the same temp directory)
    }
  };

  public resetTempUploadDirId = () => {
    this.tempDirId = undefined;
  };

  public parseFormData = async <T>(req: Request): Promise<DeepPartial<T>> => {
    let fields: { [key: string]: unknown } = {};
    if (req.files) {
      if (Array.isArray(req.files) || typeof req.files !== 'object') {
        // do not support array payload
        throw new InvalidPayloadFormatException();
      }
      if (this._isPayloadTooLarge(req.files)) {
        throw new UploadMaxFileSizeError();
      }

      for (let field in req.files) {
        let fieldValue: UploadedFile | UploadedFile[];
        if (Array.isArray(req.files[field])) {
          fieldValue = (req.files[field] as ExpressUploadedFile[]).map((file) =>
            this._makeUploadedFileCompatible(file)
          );
        } else {
          fieldValue = this._makeUploadedFileCompatible(
            req.files[field] as ExpressUploadedFile
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

  private storeFileInS3Bucket = async (
    { uploadedFile, filename, directory }: StoreFileParams,
    isPublic = false
  ): Promise<string> => {
    let targetKey = this.getTargetFilename(uploadedFile, filename);
    targetKey = directory ? `${directory}/${targetKey}` : targetKey;

    const newTempFilepath = `${uploadedFile.filepath}${path.extname(
      uploadedFile.originalFilename
    )}`;

    await renameAsync(uploadedFile.filepath, newTempFilepath);
    // move the temp file on the local filesystem to the S3
    const content = await readFileAsync(newTempFilepath);
    const writeFileResult = isPublic
      ? await this.getS3Storage().writeFilePublicly(targetKey, content)
      : await this.getS3Storage().writeFile(targetKey, content);
    await unlinkAsync(newTempFilepath);

    return writeFileResult.pathInStorage;
  };

  private storeFileLocally = async (
    { uploadedFile, filename, directory }: StoreFileParams,
    isPublic = false
  ): Promise<string> => {
    const targetFilepath = getPathInStorage(
      this.getLocalTargetFilepath(uploadedFile, directory ?? '', filename),
      isPublic
    );

    const absoluteFilepath =
      this.getLocalStorage().getAbsolutePath(targetFilepath);
    const dir = path.dirname(absoluteFilepath);
    if (dir && !(await existsAsync(dir))) {
      await mkdirAsync(dir, {
        recursive: true
      });
    }

    await renameAsync(uploadedFile.filepath, absoluteFilepath);

    return targetFilepath;
  };

  public storeFile = async (params: StoreFileParams): Promise<string> => {
    if (getDriver() === FileSystemDriver.s3) {
      return this.storeFileInS3Bucket(params);
    }

    return this.storeFileLocally(params);
  };

  public storeFilePublicly = async (
    params: StoreFileParams
  ): Promise<string> => {
    if (getDriver() === FileSystemDriver.s3) {
      return this.storeFileInS3Bucket(params, true);
    }

    return this.storeFileLocally(params, true);
  };

  public storeFiles = ({
    uploadedFiles,
    directory
  }: StoreFilesParams): Promise<string[]> => {
    const storeFilePromises: Promise<string>[] = uploadedFiles.map(
      (uploadedFile) =>
        this.storeFile({
          uploadedFile,
          directory
        })
    );

    return Promise.all(storeFilePromises);
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

  private getFileExtension = (filepath: string | null) => {
    if (!filepath) {
      return ``;
    }

    return path.extname(filepath).toLowerCase();
  };

  private generateRandomFilename = () => generateUuid();

  private getTargetFilename = (
    uploadedFile: UploadedFile,
    filename?: string
  ): string => {
    const fileExtension = this.getFileExtension(uploadedFile.originalFilename);
    return filename
      ? `${filename}${fileExtension}`
      : `${this.generateRandomFilename()}${fileExtension}`;
  };

  private getLocalTargetFilepath = (
    uploadedFile: UploadedFile,
    destDir: string,
    filename?: string
  ) => path.join(destDir, this.getTargetFilename(uploadedFile, filename));

  /**
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

  _getTempDirId = (): string => {
    if (!this.tempDirId) {
      this.tempDirId = generateUuid();
    }

    return this.tempDirId;
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

  _makeUploadedFileCompatible = (
    originalFile: ExpressUploadedFile
  ): UploadedFile => {
    return new UploadedFile({
      originalFilename: originalFile.name,
      filepath: originalFile.tempFilePath,
      size: originalFile.size,
      mimetype: originalFile.mimetype,
      hash: originalFile.md5
    });
  };
}
