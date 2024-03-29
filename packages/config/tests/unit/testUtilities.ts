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
  return stub(utilities, `getEnvVariables`).returns(
    mockVars as Record<string, undefined>
  );
};

export const mockIsRunningFrameworkTests = (value: boolean): SinonStub => {
  const subjectFuncStub = sinon.stub(utilities, `isRunningFrameworkTests`);
  return subjectFuncStub.returns(value);
};

export const mockIsTestEnvironment = (returnValue: boolean): SinonStub => {
  const subjectFuncStub = sinon.stub(utilities, `isTestEnvironment`);
  return subjectFuncStub.returns(returnValue);
};
