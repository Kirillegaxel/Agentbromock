import { ASSUMPTIONS, DAY_MS, type Assumptions } from "./assumptions";
import type { Subscription } from "./types";

export type SubscriptionPhase =
  /** Оплаченный срок идёт. */
  | "active"
  /** До окончания осталось несколько дней. */
  | "expiring"
  /** Срок закончился, аккаунт сохраняется за клиентом. */
  | "grace"
  /** Период сохранения тоже закончился; дальнейшая судьба аккаунта не определена. */
  | "storage_over";

export type AccessState =
  | "ok"
  | "paused_unpaid"
  | "blocked"
  | "review"
  | "denied";

export interface SubscriptionView {
  phase: SubscriptionPhase;
  /** Целых суток до окончания оплаты (0, если закончилась). */
  daysLeft: number;
  /** Миллисекунд до окончания оплаты (может быть отрицательным). */
  msLeft: number;
  graceEndsAt: number;
  graceDaysLeft: number;
  /** Можно ли сейчас работать в аккаунте. */
  access: AccessState;
  canRenew: boolean;
  /** Каким будет срок после продления, если оплатить сейчас. */
  renewedUntil: number;
}

export function periodMs(a: Assumptions = ASSUMPTIONS): number {
  return a.periodDays * DAY_MS;
}

/** Правило продления — см. ASSUMPTIONS.renewal. */
export function nextPaidUntil(
  paidUntil: number,
  now: number,
  a: Assumptions = ASSUMPTIONS,
): number {
  const base = paidUntil > now ? paidUntil : now;
  return base + periodMs(a);
}

export function getPhase(
  paidUntil: number,
  now: number,
  a: Assumptions = ASSUMPTIONS,
): SubscriptionPhase {
  if (now < paidUntil) {
    return paidUntil - now <= a.expiringSoonDays * DAY_MS ? "expiring" : "active";
  }
  return now < paidUntil + a.graceDays * DAY_MS ? "grace" : "storage_over";
}

export function describeSubscription(
  sub: Pick<Subscription, "paidUntil" | "incident">,
  now: number,
  a: Assumptions = ASSUMPTIONS,
): SubscriptionView {
  const phase = getPhase(sub.paidUntil, now, a);
  const msLeft = sub.paidUntil - now;
  const graceEndsAt = sub.paidUntil + a.graceDays * DAY_MS;
  const incident = sub.incident?.status;

  let access: AccessState = "ok";
  if (incident === "blocked") access = "blocked";
  else if (incident === "review") access = "review";
  else if (incident === "denied") access = "denied";
  else if (phase === "grace" || phase === "storage_over") {
    access = a.workDuringGrace && phase === "grace" ? "ok" : "paused_unpaid";
  }

  const incidentBlocksRenewal =
    incident === "blocked" || incident === "review" || incident === "denied";

  return {
    phase,
    msLeft,
    daysLeft: msLeft > 0 ? Math.ceil(msLeft / DAY_MS) : 0,
    graceEndsAt,
    graceDaysLeft: Math.max(0, Math.ceil((graceEndsAt - now) / DAY_MS)),
    access,
    canRenew: !incidentBlocksRenewal,
    renewedUntil: nextPaidUntil(sub.paidUntil, now, a),
  };
}
