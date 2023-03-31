import axios, { AxiosResponse } from 'axios';
import { HttpError, Headers, HttpResult, HttpVerb } from './types';
import { HttpContract } from './httpContract';

export class AxiosHttp implements HttpContract {
  private static instance: AxiosHttp;

  public static getInstance = (): AxiosHttp => {
    if (!AxiosHttp.instance) {
      AxiosHttp.instance = new AxiosHttp();
    }
    return AxiosHttp.instance;
  };

  public get = async <ResponseBody>(
    url: string,
    headers?: Headers
  ): Promise<HttpResult<ResponseBody>> => {
    return this.send(`GET`, url, null, headers);
  };

  public post = async <ResponseBody>(
    url: string,
    data: object | null,
    headers?: Headers
  ): Promise<HttpResult<ResponseBody>> => {
    return this.send(`POST`, url, data, headers);
  };

  public put = async <ResponseBody>(
    url: string,
    data: object | null,
    headers?: Headers
  ): Promise<HttpResult<ResponseBody>> => {
    return this.send(`PUT`, url, data, headers);
  };

  public delete = async <ResponseBody>(
    url: string,
    headers?: Headers
  ): Promise<HttpResult<ResponseBody>> => {
    return this.send(`DELETE`, url, null, headers);
  };

  public patch = async <ResponseBody>(
    url: string,
    data: object | null,
    headers?: Headers
  ): Promise<HttpResult<ResponseBody>> => {
    return this.send(`PATCH`, url, data, headers);
  };

  private send = async <ResponseBody>(
    verb: HttpVerb,
    url: string,
    data: object | null,
    headers?: Headers
  ): Promise<HttpResult<ResponseBody>> => {
    try {
      let successResult: AxiosResponse;
      switch (verb) {
        case 'POST': {
          successResult = await axios.post(url, data, {
            headers: headers ?? {}
          });
          break;
        }
        case 'PUT': {
          successResult = await axios.put(url, data, {
            headers: headers ?? {}
          });
          break;
        }
        case 'DELETE': {
          successResult = await axios.delete(url, {
            headers: headers ?? {}
          });
          break;
        }
        case 'PATCH': {
          successResult = await axios.patch(url, data, {
            headers: headers ?? {}
          });
          break;
        }
        default: {
          // GET
          successResult = await axios.get(url, {
            headers: headers ?? {}
          });
          break;
        }
      }

      return new HttpResult<ResponseBody>(
        successResult.status,
        successResult.data
      );
    } catch (e) {
      if (axios.isAxiosError(e)) {
        return this.handleAxiosError(e);
      }
      throw new HttpError(0, `Unable to make network request.`, null);
    }
  };

  private handleAxiosError = (e: {
    message: string;
    response?: {
      data: unknown;
    };
  }) => {
    if (!axios.isAxiosError(e)) {
      throw new Error(`Invalid application logic.`);
    }
    const responseData = e.response?.data;
    if (!responseData) {
      throw new HttpError(0, e.message, null);
    }

    throw new HttpError(
      responseData.statusCode,
      responseData.message ?? `Unable to make network request.`,
      responseData ?? null
    );
  };
}
