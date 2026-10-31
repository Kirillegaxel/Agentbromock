import { createSeed } from "./seed";
import { MOCK_DB_VERSION, type MockDb } from "./db";

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STORAGE_KEY = "hermes-mock-db";

/**
 * Хранилище мокового состояния: держит копию в памяти, сохраняет в KeyValueStorage
 * (в браузере — localStorage) и сообщает подписчикам об изменениях,
 * в том числе сделанных в другой вкладке.
 */
export class MockStore {
  private db: MockDb | null = null;
  private listeners = new Set<() => void>();

  constructor(
    private readonly storage: KeyValueStorage | null,
    private readonly realNow: () => number = () => Date.now(),
  ) {}

  /** Демо-время: реальное время плюс сдвиг из демо-панели. */
  now(): number {
    return this.realNow() + this.read().clockOffsetMs;
  }

  read(): MockDb {
    if (!this.db) this.db = this.load();
    return this.db;
  }

  /** Выполняет изменение атомарно: при ошибке состояние не меняется. */
  transact<T>(fn: (draft: MockDb, now: number) => T): T {
    const draft = structuredClone(this.read());
    const result = fn(draft, this.realNow() + draft.clockOffsetMs);
    this.db = draft;
    this.persist();
    this.emit();
    return result;
  }

  reset(): void {
    this.db = createSeed(this.realNow());
    this.persist();
    this.emit();
  }

  /** Перечитать из хранилища (другая вкладка изменила данные). */
  reload(): void {
    this.db = null;
    this.emit();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private load(): MockDb {
    const raw = this.storage?.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as MockDb;
        if (parsed.version === MOCK_DB_VERSION) return parsed;
      } catch {
        // повреждённые данные — начинаем с исходного состояния
      }
    }
    const seed = createSeed(this.realNow());
    this.db = seed;
    this.persist();
    return seed;
  }

  private persist() {
    if (this.db) this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.db));
  }
}

export function memoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}
