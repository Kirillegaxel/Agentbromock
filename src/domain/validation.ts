import type { ContactChannel } from "./types";

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEGRAM_RE = /^@?[a-zA-Z0-9_]{5,32}$/;
const PHONE_RE = /^\+?[0-9 ()-]{10,20}$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Укажите почту.";
  if (!EMAIL_RE.test(v)) return "Похоже, в адресе ошибка. Пример: name@example.com";
  return undefined;
}

export function validateContact(
  channel: ContactChannel,
  value: string,
): string | undefined {
  const v = value.trim();
  if (!v) return "Оставьте контакт, чтобы мы могли с вами связаться.";
  if (channel === "email") return validateEmail(v);
  if (channel === "telegram" && !TELEGRAM_RE.test(v))
    return "Укажите имя пользователя Telegram, например @username.";
  if (channel === "phone" && (!PHONE_RE.test(v) || v.replace(/\D/g, "").length < 10))
    return "Укажите номер полностью, например +7 900 123-45-67.";
  return undefined;
}

export function validateName(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Как к вам обращаться?";
  if (v.length > 80) return "Слишком длинное имя — сократите до 80 символов.";
  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (value.length < 8) return "Пароль должен быть не короче 8 символов.";
  if (!/[0-9]/.test(value) || !/[^0-9]/.test(value))
    return "Добавьте в пароль и буквы, и цифры.";
  return undefined;
}

export function validatePrice(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Укажите цену.";
  if (!/^\d+$/.test(v)) return "Цена — целое число рублей, без пробелов и копеек.";
  const n = Number(v);
  if (n < 100) return "Цена не может быть меньше 100 ₽.";
  if (n > 1_000_000) return "Цена не может быть больше 1 000 000 ₽.";
  return undefined;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}
