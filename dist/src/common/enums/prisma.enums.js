"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalStatus = exports.OrderType = exports.OrderStatus = exports.TransactionType = exports.UserStatus = void 0;
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["SUSPENDED"] = "SUSPENDED";
    UserStatus["PENDING_VERIFICATION"] = "PENDING_VERIFICATION";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["BUY"] = "BUY";
    TransactionType["SELL"] = "SELL";
    TransactionType["DEPOSIT"] = "DEPOSIT";
    TransactionType["WITHDRAWAL"] = "WITHDRAWAL";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["EXECUTED"] = "EXECUTED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["FAILED"] = "FAILED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var OrderType;
(function (OrderType) {
    OrderType["BUY"] = "BUY";
    OrderType["SELL"] = "SELL";
})(OrderType || (exports.OrderType = OrderType = {}));
var WithdrawalStatus;
(function (WithdrawalStatus) {
    WithdrawalStatus["PENDING"] = "PENDING";
    WithdrawalStatus["READY_FOR_PICKUP"] = "READY_FOR_PICKUP";
    WithdrawalStatus["COMPLETED"] = "COMPLETED";
    WithdrawalStatus["EXPIRED"] = "EXPIRED";
    WithdrawalStatus["CANCELLED"] = "CANCELLED";
})(WithdrawalStatus || (exports.WithdrawalStatus = WithdrawalStatus = {}));
//# sourceMappingURL=prisma.enums.js.map