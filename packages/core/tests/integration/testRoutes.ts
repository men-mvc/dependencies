import { TestApplication } from './testApplication';
import { registerFileSystemTestRoutes } from './fileSystem/support/testRoutes';

export const configureTestRoutes = (application: TestApplication) => {
  registerFileSystemTestRoutes(application);
};
