import fs from "fs";

export const readStreamAsBuffer = async (readStream: fs.ReadStream): Promise<Buffer> => {
    return new Promise<Buffer>((resolve) => {
        let data: Buffer[] = [];
        readStream.on(`data`, (chunk) => {
            data.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        });
        readStream.on(`end`, () => {
            resolve(Buffer.concat(data));
        });
        readStream.on(`error`, (err) => {
            throw err;
        });
    });
};
