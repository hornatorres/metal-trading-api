import { HttpException, HttpStatus } from '@nestjs/common';
export declare class BusinessException extends HttpException {
    constructor(message: string, status?: HttpStatus);
}
export declare class InsufficientFundsException extends BusinessException {
    constructor(detail?: string);
}
export declare class InsufficientInventoryException extends BusinessException {
    constructor(available: number, requested: number);
}
export declare class InsufficientMetalBalanceException extends BusinessException {
    constructor(available: number, requested: number, symbol: string);
}
export declare class UserNotActiveException extends BusinessException {
    constructor(status: string);
}
