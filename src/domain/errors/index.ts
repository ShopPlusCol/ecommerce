export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} no encontrado: ${id}`, "NOT_FOUND");
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message, "VALIDATION_ERROR");
  }
}

export class InsufficientStockError extends DomainError {
  constructor(sku: string, requested: number, available: number) {
    super(
      `Stock insuficiente para ${sku}: solicitado ${requested}, disponible ${available}`,
      "INSUFFICIENT_STOCK",
    );
  }
}

export class InvalidCouponError extends DomainError {
  constructor(reason: string) {
    super(`Cupón inválido: ${reason}`, "INVALID_COUPON");
  }
}

export class ShippingRateUnavailableError extends DomainError {
  constructor(zoneDescription: string) {
    super(`No hay tarifa de envío configurada para: ${zoneDescription}`, "SHIPPING_RATE_UNAVAILABLE");
  }
}

export class PaymentError extends DomainError {
  constructor(message: string) {
    super(message, "PAYMENT_ERROR");
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "No autorizado") {
    super(message, "UNAUTHORIZED");
  }
}
