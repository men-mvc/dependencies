export type HttpVerb = `GET` | `PUT` | `POST` | `DELETE` | `PATCH`;

export class HttpError {
  constructor(
    readonly status: number,
    readonly message: string,
    readonly body: unknown | null
  ) {}
}

export class HttpResult<ResponseBody> {
  constructor(readonly status: number, readonly body: ResponseBody) {}
}

export type Headers = { [key: string]: string };
