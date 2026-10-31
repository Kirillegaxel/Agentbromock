export type DomainErrorCode =
  | "not_found"
  | "unauthorized"
  | "forbidden"
  | "validation"
  | "out_of_stock"
  | "already_subscribed"
  | "renewal_unavailable"
  | "invalid_credentials"
  | "conflict";

/** Ошибка предметной области с понятным пользователю сообщением. */
export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof DomainError) return error.message;
  return "Что-то пошло не так. Попробуйте ещё раз.";
}
