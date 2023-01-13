export interface CacheContract {
  connect: () => Promise<void>;

  disconnect: () => Promise<void>;

  get: <T>(key: string) => Promise<T | null>;

  // duration is in seconds
  store: <T>(key: string, data: T, duration?: number) => Promise<void>;

  delete: (key: string) => Promise<void>;

  clear: () => Promise<void>;
}
