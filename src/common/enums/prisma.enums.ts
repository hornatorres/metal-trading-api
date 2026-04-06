/**
 * These enums mirror the Prisma schema.
 * Once `prisma generate` runs they are also available from @prisma/client.
 * Defining them here allows the project to compile before the first migration.
 */

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  EXECUTED = 'EXECUTED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum OrderType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}
