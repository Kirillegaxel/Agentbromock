import { DomainError } from "@/domain/errors";
import type { HermesApi, PaymentGatewaySimulator } from "../api";
import * as ops from "./operations";
import type { MockDb } from "./db";
import type { MockStore } from "./store";

export interface MockApiOptions {
  /** Искусственная задержка ответа, чтобы были видны состояния загрузки. */
  latencyMs?: number;
}

/** Реализация HermesApi поверх локального мокового состояния. */
export function createMockApi(store: MockStore, options: MockApiOptions = {}): {
  api: HermesApi;
  gateway: PaymentGatewaySimulator;
} {
  const latency = options.latencyMs ?? 0;
  const wait = () => (latency ? new Promise((r) => setTimeout(r, latency)) : Promise.resolve());
  const clone = <T>(value: T): T => structuredClone(value);

  const query = async <T>(fn: (db: MockDb, now: number) => T): Promise<T> => {
    await wait();
    return clone(fn(store.read(), store.now()));
  };
  const mutate = async <T>(fn: (db: MockDb, now: number) => T): Promise<T> => {
    await wait();
    return clone(store.transact(fn));
  };

  const api: HermesApi = {
    listPlans: () => query((db) => ops.plansWithAvailability(db)),
    getPlan: (id) => query((db) => ops.plansWithAvailability(db).find((p) => p.id === id) ?? null),
    getLandingSettings: () => query((db) => db.settings),

    getSession: () => query((db) => ops.sessionInfo(db)),
    login: (email, password) =>
      mutate((db) => {
        ops.login(db, email, password);
        return ops.sessionInfo(db);
      }),
    logout: () => mutate((db) => ops.logout(db)),
    setPassword: (password) =>
      mutate((db) => {
        ops.setPassword(db, password);
        return ops.sessionInfo(db);
      }),
    adminLogin: (email, password) =>
      mutate((db) => {
        ops.adminLogin(db, email, password);
        return ops.sessionInfo(db);
      }),

    startPurchase: (input) => mutate((db, now) => ops.startPurchase(db, input, now)),
    startRenewal: (provider) => mutate((db, now) => ops.startRenewal(db, provider, now)),
    getPayment: (id) =>
      query((db) => {
        const payment = db.payments.find((p) => p.id === id) ?? null;
        // Платёж видит только тот, кто его оформил, или администратор.
        if (payment?.userId && db.session.role === "client" && db.session.userId !== payment.userId)
          return null;
        return payment;
      }),

    getMyAccess: () => query((db, now) => ops.myAccess(db, now)),
    requestReview: () => mutate((db, now) => ops.requestReview(db, now)),

    submitWaitlist: (input) => mutate((db, now) => ops.submitWaitlist(db, input, now)),
    submitCorporate: (input) => mutate((db, now) => ops.submitCorporate(db, input, now)),

    admin: {
      listPlans: () => query((db) => ops.adminListPlans(db)),
      updatePlan: (id, patch) => mutate((db) => ops.updatePlan(db, id, patch)),
      listInventory: () => query((db) => ops.listInventory(db)),
      addAccounts: (planId, count) => mutate((db, now) => ops.addAccounts(db, planId, count, now)),
      listRequests: (filter) => query((db) => ops.listRequests(db, filter)),
      setRequestStatus: (id, status) => mutate((db) => ops.setRequestStatus(db, id, status)),
      setCorporateBlock: (enabled) =>
        mutate((db) => {
          ops.setCorporateBlock(db, enabled);
          return db.settings;
        }),
    },

    subscribe: (listener) => store.subscribe(listener),
  };

  const gateway: PaymentGatewaySimulator = {
    getPayment: (id) => query((db) => db.payments.find((p) => p.id === id) ?? null),
    complete: (id, outcome) =>
      mutate((db, now) => {
        if (!db.payments.some((p) => p.id === id)) throw new DomainError("not_found", "Платёж не найден.");
        return ops.completePayment(db, id, outcome, now);
      }),
  };

  return { api, gateway };
}
