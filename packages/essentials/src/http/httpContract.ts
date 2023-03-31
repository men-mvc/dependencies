import { Headers, HttpResult } from './types';

export interface HttpContract {
  get: <ResponseBody>(
    url: string,
    headers?: Headers
  ) => Promise<HttpResult<ResponseBody>>;

  post: <ResponseBody>(
    url: string,
    data: null | object,
    headers?: Headers
  ) => Promise<HttpResult<ResponseBody>>;

  put: <ResponseBody>(
    url: string,
    data: null | object,
    headers?: Headers
  ) => Promise<HttpResult<ResponseBody>>;

  delete: <ResponseBody>(
    url: string,
    headers?: Headers
  ) => Promise<HttpResult<ResponseBody>>;

  patch: <ResponseBody>(
    url: string,
    data: null | object,
    headers?: Headers
  ) => Promise<HttpResult<ResponseBody>>;
}
