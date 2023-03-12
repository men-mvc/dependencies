import { setEnvVariable } from '@men-mvc/config';
import {
    getAppStorageDirectory
} from '../../src';

describe(`App Utility`, () => {
    afterEach(() => (process.env['SERVER_DIRECTORY'] = undefined));

    describe(`getAppStorageDirectory`, () => {
        afterAll(() => {
            setEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, ``);
        });

        it(`should return value of FILESYSTEM_STORAGE_DIRECTORY env variable when var is set`, () => {
            const fakeStorageDir = `~/home/custom_storage`;
            setEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, fakeStorageDir);
            const storageDir = getAppStorageDirectory();
            expect(storageDir).toBe(fakeStorageDir);
        });

        it(`should return cwd/storage by default`, () => {
            setEnvVariable(`FILESYSTEM_STORAGE_DIRECTORY`, ``);
            const storageDir = getAppStorageDirectory();
            expect(storageDir).toBe(`${process.cwd()}/storage`);
        });
    });
});
