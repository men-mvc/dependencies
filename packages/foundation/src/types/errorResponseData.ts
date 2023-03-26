export type ErrorResponseData<T> = {
  code?: string;
  message: string;
  details?: T | null;
};
