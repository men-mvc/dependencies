import { EnvVarDataType } from './envVarDataType';
import { isNil } from 'lodash';

export type EnvVarDeclaration = {
  name: string;
  type: EnvVarDataType;
};

export const isEnvVarDeclaration = (arg: unknown): arg is EnvVarDeclaration => {
  if (typeof arg !== 'object') {
    return false;
  }
  const declaration = arg as { name?: string; type?: string };
  if (!declaration.name || typeof declaration.name !== 'string') {
    return false;
  }
  if (isNil(declaration.type)) {
    return false;
  }
  if (
    declaration.type &&
    !Object.entries(EnvVarDataType)
      .map((tuple) => tuple[1])
      .includes(declaration.type as EnvVarDataType)
  ) {
    // invalid type
    return false;
  }

  return true;
};
