export const getAppEnv = () => getEnvVariable(`NODE_ENV`, `local`);

let envVars: { [key: string]: string | undefined };
export const getEnvVariables = () => {
  if (!envVars) {
    envVars = process.env;
  }

  return envVars;
};

export const getEnvVariable = <T>(key: string, defaultValue: T): T => {
  const vars = getEnvVariables();
  return vars[key] ? (vars[key] as T) : defaultValue;
};

export const setEnvVariable = (key: string, value: string) => {
  if (!envVars) {
    envVars = getEnvVariables();
  }
  envVars[key] = value;
  process.env[key] = value;
};

/**
 * the functions inside this file are available within the core package only
 */
export const isRunningCoreTests = (): boolean =>
  process.env.CORE_TEST ? true : false;
