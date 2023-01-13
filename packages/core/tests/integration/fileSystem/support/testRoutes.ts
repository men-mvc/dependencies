import { TestApplication } from '../../testApplication';
import {
  routeHandlerParseForm,
  routeHandlerStoreFile,
  routeHandlerStoreFiles
} from './testRouteHandlers';

export const registerFileSystemTestRoutes = (app: TestApplication) => {
  app.app.post(`/fileSystem/parseFormData`, routeHandlerParseForm);
  app.app.post(`/fileSystem/storeFile`, routeHandlerStoreFile);
  app.app.post(`/fileSystem/storeFiles`, routeHandlerStoreFiles);
};
