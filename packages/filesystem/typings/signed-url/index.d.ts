declare module 'signed-url' {
  export default function (config: { secret: string; key: string });

  export declare function sign(
    url: string,
    options: {
      method: string;
      ttl: number;
    }
  ): string;

  export declare function verify(
    signedUrl: string,
    options: {
      method: string;
    }
  ): boolean;
}
