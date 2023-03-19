import { TestApplication } from './testApplication';
import { registerFileSystemTestRoutes } from './filesystem/support/testRoutes';

export const configureTestRoutes = (application: TestApplication) => {
  registerFileSystemTestRoutes(application);
};
