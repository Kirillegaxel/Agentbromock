import type {
  HermesAccount,
  LandingSettings,
  LeadRequest,
  Payment,
  Plan,
  Role,
  Subscription,
  User,
} from "@/domain/types";

/** Всё состояние демо. Хранится в localStorage браузера. */
export interface MockDb {
  version: typeof MOCK_DB_VERSION;
  /** Счётчик для читаемых идентификаторов. */
  seq: number;
  /** Сдвиг демо-часов относительно реального времени (демо-панель). */
  clockOffsetMs: number;
  plans: Plan[];
  accounts: HermesAccount[];
  users: User[];
  subscriptions: Subscription[];
  payments: Payment[];
  requests: LeadRequest[];
  settings: LandingSettings;
  session: { role: Role; userId: string | null };
  admin: { email: string; passwordHash: string };
}

export const MOCK_DB_VERSION = 1 as const;

export function nextId(db: MockDb, prefix: string): string {
  db.seq += 1;
  return `${prefix}_${db.seq.toString(36).padStart(4, "0")}`;
}

/**
 * Демонстрационный «хеш». Это НЕ безопасное хранение паролей —
 * в прототипе оно и не требуется, но пароль хотя бы не лежит открытым текстом.
 */
export function demoHash(value: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `demo$${(h >>> 0).toString(16)}`;
}
