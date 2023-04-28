import { HttpContract } from './httpContract';
import { AxiosHttp } from './axiosHttp';

export const http: HttpContract = AxiosHttp.getInstance();

export * from './axiosHttp';
export * from './types';
export * from './httpContract';
