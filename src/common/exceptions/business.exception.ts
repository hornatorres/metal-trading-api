// ─────────────────────────────────────────────────────────────────────────────
//  business.exception.ts  —  VERSIÓN CORREGIDA
//
//  Sin cambios en la lógica, pero se documenta explícitamente que
//  InsufficientInventoryException debe usarse en lugar de NotFoundException
//  para el caso de stock insuficiente (FIX-3 del audit).
//
//  También se agrega UserSuspendedException para el [FIX-5].
// ─────────────────────────────────────────────────────────────────────────────

import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super({ message, error: 'Business Rule Violation' }, status);
  }
}

/**
 * HTTP 422 — El usuario no tiene suficiente saldo USD para completar la compra.
 */
export class InsufficientFundsException extends BusinessException {
  constructor(detail?: string) {
    super(
      `Insufficient funds${detail ? ': ' + detail : ''}`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/**
 * HTTP 422 — El inventario físico no tiene suficiente stock disponible.
 *
 * NOTA: usar ESTA excepción (no NotFoundException) cuando el metal existe
 * pero no hay stock. NotFoundException implica que el recurso no existe.
 */
export class InsufficientInventoryException extends BusinessException {
  constructor(available: number, requested: number) {
    super(
      `Insufficient inventory. Available: ${available} kg, Requested: ${requested} kg`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/**
 * HTTP 422 — El usuario no tiene suficiente balance del metal para vender.
 */
export class InsufficientMetalBalanceException extends BusinessException {
  constructor(available: number, requested: number, symbol: string) {
    super(
      `Insufficient ${symbol} balance. Available: ${available} kg, Requested: ${requested} kg`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/**
 * HTTP 403 — El usuario está suspendido o pendiente de verificación.
 * No puede realizar operaciones de trading. [FIX-5]
 */
export class UserNotActiveException extends BusinessException {
  constructor(status: string) {
    super(
      `User account is ${status}. Trading operations are not allowed.`,
      HttpStatus.FORBIDDEN,
    );
  }
}
