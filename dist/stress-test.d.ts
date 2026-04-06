declare const BASE_URL = "http://localhost:3000/api/v1";
declare const C: {
    reset: string;
    green: string;
    red: string;
    yellow: string;
    cyan: string;
    bold: string;
    dim: string;
};
declare function api(method: string, path: string, body?: object): Promise<any>;
declare function sleep(ms: number): Promise<unknown>;
declare function rand(min: number, max: number, decimals?: number): number;
declare function fmt(n: number): string;
declare const stats: {
    buys: {
        ok: number;
        fail: number;
        totalKg: number;
        totalUsd: number;
    };
    sells: {
        ok: number;
        fail: number;
        totalKg: number;
        totalUsd: number;
    };
    withdrawals: {
        ok: number;
        fail: number;
        totalKg: number;
    };
    errors: string[];
};
declare function main(): Promise<void>;
