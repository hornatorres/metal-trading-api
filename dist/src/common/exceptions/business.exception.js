"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNotActiveException = exports.InsufficientMetalBalanceException = exports.InsufficientInventoryException = exports.InsufficientFundsException = exports.BusinessException = void 0;
const common_1 = require("@nestjs/common");
class BusinessException extends common_1.HttpException {
    constructor(message, status = common_1.HttpStatus.BAD_REQUEST) {
        super({ message, error: 'Business Rule Violation' }, status);
    }
}
exports.BusinessException = BusinessException;
class InsufficientFundsException extends BusinessException {
    constructor(detail) {
        super(`Insufficient funds${detail ? ': ' + detail : ''}`, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
exports.InsufficientFundsException = InsufficientFundsException;
class InsufficientInventoryException extends BusinessException {
    constructor(available, requested) {
        super(`Insufficient inventory. Available: ${available} kg, Requested: ${requested} kg`, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
exports.InsufficientInventoryException = InsufficientInventoryException;
class InsufficientMetalBalanceException extends BusinessException {
    constructor(available, requested, symbol) {
        super(`Insufficient ${symbol} balance. Available: ${available} kg, Requested: ${requested} kg`, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
exports.InsufficientMetalBalanceException = InsufficientMetalBalanceException;
class UserNotActiveException extends BusinessException {
    constructor(status) {
        super(`User account is ${status}. Trading operations are not allowed.`, common_1.HttpStatus.FORBIDDEN);
    }
}
exports.UserNotActiveException = UserNotActiveException;
//# sourceMappingURL=business.exception.js.map