import sinon, { SinonStub, stub } from 'sinon';
import * as utilities from '../../src/utilities';

export const mockGetAppEnv = (env: string): SinonStub => {
  const subjectFuncStub = stub(utilities, `getAppEnv`);
  return subjectFuncStub.callsFake(jest.fn().mockReturnValue(env));
};

export const mockGetAppProjectConfigDirectory = (dir: string): SinonStub => {
  const subjectFuncStub = stub(utilities, 'getAppProjectConfigDirectory');
  return subjectFuncStub.callsFake(jest.fn().mockReturnValue(dir));
};

export const mockGetEnvVariables = (
  mockVars: Record<string, unknown>
): SinonStub => {
  const subjectFuncStub = stub(utilities, `getEnvVariables`);
  return subjectFuncStub.callsFake(jest.fn().mockReturnValue(mockVars));
};

export const mockIsRunningCoreTests = (value: boolean): SinonStub => {
  const subjectFuncStub = sinon.stub(utilities, `isRunningCoreTests`);
  return subjectFuncStub.returns(value);
};
