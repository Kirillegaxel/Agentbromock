/**
 * Служебные средства проверяющего: сброс, выбор роли, перемотка времени,
 * подстановка состояний. Не входят в HermesApi и не используются страницами продукта —
 * только демо-панелью. При подключении бэкенда этот модуль просто не подключается.
 */
import { ASSUMPTIONS, DAY_MS } from "@/domain/assumptions";
import { DomainError } from "@/domain/errors";
import type { IncidentStatus } from "@/domain/types";
import * as ops from "../mock/operations";
import { DEMO_USERS, sampleRequests } from "../mock/seed";
import type { MockStore } from "../mock/store";

export type DemoUserKey = keyof typeof DEMO_USERS;
export type DemoPhase = "active" | "expiring" | "grace" | "storage_over";

export interface DemoSnapshot {
  now: number;
  clockOffsetDays: number;
  role: "guest" | "client" | "admin";
  userEmail: string | null;
  hasSubscription: boolean;
  incident: IncidentStatus | null;
  requestsCount: number;
  corporateBlockEnabled: boolean;
}

export function createDemoControls(store: MockStore) {
  const currentSub = (db: ReturnType<MockStore["read"]>) => {
    const sub = db.session.role === "client"
      ? db.subscriptions.find((s) => s.userId === db.session.userId)
      : undefined;
    if (!sub) throw new DomainError("not_found", "Сначала войдите как пользователь с подпиской.");
    return sub;
  };

  return {
    snapshot(): DemoSnapshot {
      const db = store.read();
      const user = db.session.role === "client" ? db.users.find((u) => u.id === db.session.userId) : null;
      const sub = user ? db.subscriptions.find((s) => s.userId === user.id) : null;
      return {
        now: store.now(),
        clockOffsetDays: Math.round(db.clockOffsetMs / DAY_MS),
        role: db.session.role,
        userEmail: user?.email ?? null,
        hasSubscription: Boolean(sub),
        incident: sub?.incident?.status ?? null,
        requestsCount: db.requests.length,
        corporateBlockEnabled: db.settings.corporateBlockEnabled,
      };
    },

    reset: () => store.reset(),

    signInAs(who: DemoUserKey | "admin" | "guest") {
      store.transact((db) => {
        if (who === "guest") db.session = { role: "guest", userId: null };
        else if (who === "admin") db.session = { role: "admin", userId: null };
        else db.session = { role: "client", userId: DEMO_USERS[who].id };
      });
    },

    shiftClock(days: number) {
      store.transact((db) => {
        db.clockOffsetMs += days * DAY_MS;
      });
    },

    resetClock() {
      store.transact((db) => {
        db.clockOffsetMs = 0;
      });
    },

    /** Поставить подписку текущего пользователя в нужное состояние срока. */
    setPhase(phase: DemoPhase) {
      store.transact((db, now) => {
        const sub = currentSub(db);
        const offsets: Record<DemoPhase, number> = {
          active: 20 * DAY_MS,
          expiring: 2 * DAY_MS,
          grace: -3 * DAY_MS,
          storage_over: -(ASSUMPTIONS.graceDays + 2) * DAY_MS,
        };
        const shift = now + offsets[phase] - sub.paidUntil;
        sub.paidUntil += shift;
        const last = sub.periods[sub.periods.length - 1];
        if (last) last.to = sub.paidUntil;
      });
    },

    setIncident(status: IncidentStatus | "none") {
      store.transact((db, now) => {
        const sub = currentSub(db);
        if (status === "none") {
          const acc = db.accounts.find((a) => a.id === sub.accountId);
          if (acc?.status === "blocked") acc.status = "assigned";
          sub.incident = null;
          return;
        }
        if (status === "blocked") return ops.blockAccount(db, sub.id, now);
        if (!sub.incident || !["blocked", "review"].includes(sub.incident.status))
          ops.blockAccount(db, sub.id, now);
        if (status === "review") {
          sub.incident!.status = "review";
          sub.incident!.reviewRequestedAt = now;
          return;
        }
        ops.resolveReview(db, sub.id, status === "replaced" ? "replace" : "deny", now);
      });
    },

    clearRequests() {
      store.transact((db) => {
        db.requests = [];
      });
    },

    restoreSampleRequests() {
      store.transact((db, now) => {
        const existing = new Set(db.requests.map((r) => r.id));
        db.requests.push(...sampleRequests(now).filter((r) => !existing.has(r.id)));
      });
    },
  };
}

export type DemoControls = ReturnType<typeof createDemoControls>;
