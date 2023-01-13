export class ErrorResponse<T> {
  constructor(
    public error: {
      code?: string;
      message: string;
      details?: T | null;
    }
  ) {}
}
