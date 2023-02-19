// TODO: rename this to FrameworkTestConfig
import { ConfigContract } from './configContract';
import { frameworkTestConfig } from './globals';

export class FrameworkTestConfig implements ConfigContract {
  public getConfig = <T>(): T => frameworkTestConfig as T;
}
