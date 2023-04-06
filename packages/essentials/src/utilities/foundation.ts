import {
  isInSourceDirectory as _isInSourceDirectory,
  getServerDirectory as _getServerDirectory,
  getAppRootDirectory as _getAppRootDirectory
} from '@men-mvc/foundation';

export const isInSourceDirectory = () => _isInSourceDirectory();
export const getServerDirectory = () => _getServerDirectory();
export const getAppRootDirectory = () => _getAppRootDirectory();
