/**
 * Правила сценариев поверх мокового состояния. Чистые функции:
 * получают копию состояния и текущее время, меняют копию или бросают DomainError.
 * Именно эти правила должен будет соблюдать настоящий бэкенд.
 */
import { DomainError } from "@/domain/errors";
import { describeSubscription, nextPaidUntil, periodMs } from "@/domain/subscription";
import type {
  CorporateRequest,
  HermesAccount,
  Payment,
  PaymentProvider,
  Plan,
  PlanWithAvailability,
  RequestStatus,
  Subscription,
  User,
  WaitlistRequest,
} from "@/domain/types";
import {
  hasErrors,
  normalizeEmail,
  validateContact,
  validateEmail,
  validateName,
  validatePassword,
  validatePrice,
  type FieldErrors,
} from "@/domain/validation";
import type {
  CorporateInput,
  InventoryRow,
  MyAccess,
  PlanPatch,
  RequestFilter,
  SessionInfo,
  StartPurchaseInput,
  WaitlistInput,
} from "../api";
import { demoHash, nextId, type MockDb } from "./db";
import { makeAccount, nextAccountNumber } from "./seed";

// ───────────────────────────── чтение ─────────────────────────────

export function freeCount(db: MockDb, planId: string): number {
  return db.accounts.filter((a) => a.planId === planId && a.status === "free").length;
}

export function plansWithAvailability(db: MockDb): PlanWithAvailability[] {
  return [...db.plans]
    .sort((a, b) => a.order - b.order)
    .map((p) => ({ ...p, available: freeCount(db, p.id) }));
}

function getPlanOrThrow(db: MockDb, planId: string): Plan {
  const plan = db.plans.find((p) => p.id === planId);
  if (!plan) throw new DomainError("not_found", "Такого тарифа нет.");
  return plan;
}

function findUserByEmail(db: MockDb, email: string): User | undefined {
  const e = normalizeEmail(email);
  return db.users.find((u) => u.email === e);
}

function subscriptionOf(db: MockDb, userId: string): Subscription | undefined {
  return db.subscriptions.find((s) => s.userId === userId);
}

export function sessionInfo(db: MockDb): SessionInfo {
  const { role, userId } = db.session;
  if (role !== "client" || !userId) return { role, user: null, needsPassword: false };
  const user = db.users.find((u) => u.id === userId);
  if (!user) return { role: "guest", user: null, needsPassword: false };
  return {
    role,
    user: { id: user.id, email: user.email, name: user.name },
    needsPassword: user.passwordHash === null,
  };
}

function currentClient(db: MockDb): User {
  const { role, userId } = db.session;
  const user = role === "client" ? db.users.find((u) => u.id === userId) : undefined;
  if (!user) throw new DomainError("unauthorized", "Войдите в личный кабинет.");
  return user;
}

function assertAdmin(db: MockDb): void {
  if (db.session.role !== "admin")
    throw new DomainError("forbidden", "Раздел доступен только администратору.");
}

export function myAccess(db: MockDb, now: number): MyAccess | null {
  if (db.session.role !== "client" || !db.session.userId) return null;
  const subscription = subscriptionOf(db, db.session.userId);
  if (!subscription) return null;
  const plan = getPlanOrThrow(db, subscription.planId);
  const account = db.accounts.find((a) => a.id === subscription.accountId);
  if (!account) return null;
  return { subscription, plan, account, view: describeSubscription(subscription, now), now };
}

// ───────────────────────────── сессия ─────────────────────────────

export function login(db: MockDb, email: string, password: string): void {
  const fields: FieldErrors = {
    email: validateEmail(email),
    password: password ? undefined : "Введите пароль.",
  };
  if (hasErrors(fields)) throw new DomainError("validation", "Проверьте поля формы.", fields as Record<string, string>);
  const user = findUserByEmail(db, email);
  if (!user || user.passwordHash === null || user.passwordHash !== demoHash(password))
    throw new DomainError("invalid_credentials", "Неверная почта или пароль.");
  db.session = { role: "client", userId: user.id };
}

export function logout(db: MockDb): void {
  db.session = { role: "guest", userId: null };
}

export function setPassword(db: MockDb, password: string): void {
  const user = currentClient(db);
  const error = validatePassword(password);
  if (error) throw new DomainError("validation", error, { password: error });
  user.passwordHash = demoHash(password);
}

export function adminLogin(db: MockDb, email: string, password: string): void {
  if (normalizeEmail(email) !== db.admin.email || demoHash(password) !== db.admin.passwordHash)
    throw new DomainError("invalid_credentials", "Неверная почта или пароль администратора.");
  db.session = { role: "admin", userId: null };
}

// ───────────────────────────── покупка ─────────────────────────────

function createPayment(
  db: MockDb,
  data: Omit<Payment, "id" | "status" | "failureReason" | "completedAt" | "redirectUrl" | "result">,
): Payment {
  const id = nextId(db, "pay");
  const payment: Payment = {
    ...data,
    id,
    status: "pending",
    failureReason: null,
    completedAt: null,
    redirectUrl: `/pay/${id}`,
    result: null,
  };
  db.payments.push(payment);
  return payment;
}

export function startPurchase(db: MockDb, input: StartPurchaseInput, now: number): Payment {
  const plan = getPlanOrThrow(db, input.planId);
  const fields: FieldErrors = {
    email: validateEmail(input.email),
    acceptedTerms: input.acceptedTerms
      ? undefined
      : "Подтвердите, что знакомы с условиями использования.",
  };
  if (!["vse-platezhi", "wata"].includes(input.provider))
    fields.provider = "Выберите способ оплаты.";
  if (hasErrors(fields))
    throw new DomainError("validation", "Проверьте поля формы.", fields as Record<string, string>);

  const email = normalizeEmail(input.email);
  const session = sessionInfo(db);
  if (session.user && session.user.email !== email)
    throw new DomainError("validation", "Покупка оформляется на почту вашего кабинета.", {
      email: "Покупка оформляется на почту вашего кабинета.",
    });

  const existing = findUserByEmail(db, email);
  if (existing && subscriptionOf(db, existing.id))
    throw new DomainError(
      "already_subscribed",
      "На эту почту уже оформлен доступ. Войдите в кабинет — там можно продлить подписку.",
    );
  if (freeCount(db, plan.id) === 0)
    throw new DomainError(
      "out_of_stock",
      "Свободные аккаунты этого тарифа закончились. Оставьте заявку — администратор свяжется с вами.",
    );

  return createPayment(db, {
    kind: "purchase",
    provider: input.provider,
    planId: plan.id,
    planName: plan.name,
    amountRub: plan.priceRub,
    email,
    userId: existing?.id ?? null,
    subscriptionId: null,
    createdAt: now,
  });
}

export function startRenewal(db: MockDb, provider: PaymentProvider, now: number): Payment {
  const user = currentClient(db);
  const sub = subscriptionOf(db, user.id);
  if (!sub) throw new DomainError("not_found", "У вас пока нет подписки для продления.");
  const view = describeSubscription(sub, now);
  if (!view.canRenew)
    throw new DomainError(
      "renewal_unavailable",
      "Продление недоступно, пока аккаунт заблокирован или обращение рассматривается.",
    );
  const plan = getPlanOrThrow(db, sub.planId);
  return createPayment(db, {
    kind: "renewal",
    provider,
    planId: plan.id,
    planName: plan.name,
    amountRub: plan.priceRub,
    email: user.email,
    userId: user.id,
    subscriptionId: sub.id,
    createdAt: now,
  });
}

function fail(payment: Payment, reason: Payment["failureReason"], now: number): Payment {
  payment.status = "failed";
  payment.failureReason = reason;
  payment.completedAt = now;
  return payment;
}

/**
 * Итог оплаты. Идемпотентно: повторный вызов для завершённого платежа
 * ничего не меняет и возвращает уже зафиксированный результат.
 */
export function completePayment(
  db: MockDb,
  paymentId: string,
  outcome: "success" | "decline" | "cancel",
  now: number,
): Payment {
  const payment = db.payments.find((p) => p.id === paymentId);
  if (!payment) throw new DomainError("not_found", "Платёж не найден.");
  if (payment.status !== "pending") return payment;

  if (outcome === "cancel") {
    payment.status = "cancelled";
    payment.completedAt = now;
    return payment;
  }
  if (outcome === "decline") return fail(payment, "declined", now);

  return payment.kind === "purchase"
    ? completePurchase(db, payment, now)
    : completeRenewal(db, payment, now);
}

function completePurchase(db: MockDb, payment: Payment, now: number): Payment {
  let user = findUserByEmail(db, payment.email);
  if (user && subscriptionOf(db, user.id)) return fail(payment, "already_subscribed", now);

  // Свободный аккаунт ищется в момент успешной оплаты: если его успели купить,
  // платёж не проходит и деньги не списываются.
  const account = db.accounts
    .filter((a) => a.planId === payment.planId && a.status === "free")
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))[0];
  if (!account) return fail(payment, "out_of_stock", now);

  const wasSignedIn = db.session.role === "client" && db.session.userId === user?.id;
  if (!user) {
    user = {
      id: nextId(db, "u"),
      email: payment.email,
      name: null,
      passwordHash: null,
      createdAt: now,
    };
    db.users.push(user);
  }

  account.status = "assigned";
  account.assignedTo = user.id;

  const paidUntil = now + periodMs();
  const sub: Subscription = {
    id: nextId(db, "sub"),
    userId: user.id,
    planId: payment.planId,
    accountId: account.id,
    startedAt: now,
    paidUntil,
    periods: [{ paymentId: payment.id, amountRub: payment.amountRub, paidAt: now, from: now, to: paidUntil }],
    incident: null,
  };
  db.subscriptions.push(sub);

  // Новый покупатель сразу попадает в кабинет и создаёт пароль.
  // Существующий пользователь с паролем входит сам — чужая почта не даёт доступа к его кабинету.
  const signedIn = wasSignedIn || user.passwordHash === null;
  if (signedIn) db.session = { role: "client", userId: user.id };

  payment.status = "succeeded";
  payment.completedAt = now;
  payment.userId = user.id;
  payment.subscriptionId = sub.id;
  payment.result = {
    subscriptionId: sub.id,
    accountId: account.id,
    needsPassword: user.passwordHash === null,
    signedIn,
    paidUntil,
  };
  return payment;
}

function completeRenewal(db: MockDb, payment: Payment, now: number): Payment {
  const sub = db.subscriptions.find((s) => s.id === payment.subscriptionId);
  if (!sub || !describeSubscription(sub, now).canRenew)
    return fail(payment, "renewal_unavailable", now);
  const from = Math.max(sub.paidUntil, now);
  sub.paidUntil = nextPaidUntil(sub.paidUntil, now);
  sub.periods.push({ paymentId: payment.id, amountRub: payment.amountRub, paidAt: now, from, to: sub.paidUntil });
  payment.status = "succeeded";
  payment.completedAt = now;
  payment.result = {
    subscriptionId: sub.id,
    accountId: sub.accountId,
    needsPassword: false,
    signedIn: true,
    paidUntil: sub.paidUntil,
  };
  return payment;
}

// ───────────────────────────── блокировка ─────────────────────────────

export function requestReview(db: MockDb, now: number): void {
  const user = currentClient(db);
  const sub = subscriptionOf(db, user.id);
  if (!sub?.incident || sub.incident.status !== "blocked")
    throw new DomainError("conflict", "Обращение уже отправлено или аккаунт не заблокирован.");
  sub.incident.status = "review";
  sub.incident.reviewRequestedAt = now;
}

export function blockAccount(db: MockDb, subscriptionId: string, now: number): void {
  const sub = db.subscriptions.find((s) => s.id === subscriptionId);
  if (!sub) throw new DomainError("not_found", "Подписка не найдена.");
  const account = db.accounts.find((a) => a.id === sub.accountId);
  if (account) account.status = "blocked";
  sub.incident = {
    status: "blocked",
    blockedAt: now,
    blockedAccountId: sub.accountId,
    reviewRequestedAt: null,
    decidedAt: null,
    decisionNote: null,
  };
}

/**
 * Решение по итогам анализа логов. В прототипе результат выбирается в демо-панели;
 * в продукте его принимает команда Hermes.
 */
export function resolveReview(
  db: MockDb,
  subscriptionId: string,
  decision: "replace" | "deny",
  now: number,
): void {
  const sub = db.subscriptions.find((s) => s.id === subscriptionId);
  if (!sub?.incident || !["blocked", "review"].includes(sub.incident.status))
    throw new DomainError("conflict", "Нет открытого обращения по блокировке.");
  if (decision === "deny") {
    sub.incident.status = "denied";
    sub.incident.decidedAt = now;
    sub.incident.decisionNote =
      "В логах использования найдено нарушение правил: автоматическая выгрузка ответов модели для обучения другой модели (дистилляция). Замена не предоставляется.";
    return;
  }
  const replacement = db.accounts
    .filter((a) => a.planId === sub.planId && a.status === "free")
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))[0];
  if (!replacement)
    throw new DomainError(
      "out_of_stock",
      "Для замены нет свободного аккаунта этого тарифа. Пополните наличие в админке.",
    );
  replacement.status = "assigned";
  replacement.assignedTo = sub.userId;
  sub.accountId = replacement.id;
  sub.incident.status = "replaced";
  sub.incident.decidedAt = now;
  sub.incident.decisionNote =
    "Нарушений правил в логах не найдено. Выдан новый аккаунт того же тарифа, срок подписки не изменился.";
}

// ───────────────────────────── заявки ─────────────────────────────

function validateLead(input: { name: string; contactChannel: WaitlistInput["contactChannel"]; contact: string }): FieldErrors {
  return {
    name: validateName(input.name),
    contact: validateContact(input.contactChannel, input.contact),
  };
}

export function submitWaitlist(db: MockDb, input: WaitlistInput, now: number): WaitlistRequest {
  const plan = getPlanOrThrow(db, input.planId);
  const fields = validateLead(input);
  if (input.comment.length > 1000) fields.comment = "Комментарий длиннее 1000 символов.";
  if (hasErrors(fields))
    throw new DomainError("validation", "Проверьте поля формы.", fields as Record<string, string>);
  const request: WaitlistRequest = {
    id: nextId(db, "req"),
    type: "waitlist",
    planId: plan.id,
    planName: plan.name,
    name: input.name.trim(),
    contactChannel: input.contactChannel,
    contact: input.contact.trim(),
    comment: input.comment.trim(),
    createdAt: now,
    status: "new",
  };
  db.requests.push(request);
  return request;
}

export function submitCorporate(db: MockDb, input: CorporateInput, now: number): CorporateRequest {
  if (!db.settings.corporateBlockEnabled)
    throw new DomainError("forbidden", "Приём корпоративных заявок сейчас закрыт.");
  const fields = validateLead(input);
  if (!input.company.trim()) fields.company = "Укажите название компании или команды.";
  if (!input.teamSize) fields.teamSize = "Выберите размер команды.";
  if (!input.message.trim()) fields.message = "Расскажите в двух словах, что нужно команде.";
  else if (input.message.length > 2000) fields.message = "Сообщение длиннее 2000 символов.";
  if (hasErrors(fields))
    throw new DomainError("validation", "Проверьте поля формы.", fields as Record<string, string>);
  const request: CorporateRequest = {
    id: nextId(db, "req"),
    type: "corporate",
    company: input.company.trim(),
    name: input.name.trim(),
    contactChannel: input.contactChannel,
    contact: input.contact.trim(),
    teamSize: input.teamSize,
    message: input.message.trim(),
    createdAt: now,
    status: "new",
  };
  db.requests.push(request);
  return request;
}

// ───────────────────────────── админка ─────────────────────────────

export function adminListPlans(db: MockDb): PlanWithAvailability[] {
  assertAdmin(db);
  return plansWithAvailability(db);
}

export function updatePlan(db: MockDb, planId: string, patch: PlanPatch): Plan {
  assertAdmin(db);
  const plan = getPlanOrThrow(db, planId);
  const fields: FieldErrors = {};
  if (patch.name !== undefined && !patch.name.trim()) fields.name = "Название не может быть пустым.";
  if (patch.name && patch.name.length > 40) fields.name = "Название длиннее 40 символов.";
  if (patch.description !== undefined && !patch.description.trim())
    fields.description = "Добавьте описание тарифа.";
  if (patch.priceRub !== undefined) fields.priceRub = validatePrice(String(patch.priceRub));
  if (patch.features && patch.features.filter((f) => f.trim()).length === 0)
    fields.features = "Добавьте хотя бы одно условие.";
  if (hasErrors(fields))
    throw new DomainError("validation", "Проверьте поля формы.", fields as Record<string, string>);

  if (patch.name !== undefined) plan.name = patch.name.trim();
  if (patch.tagline !== undefined) plan.tagline = patch.tagline.trim();
  if (patch.description !== undefined) plan.description = patch.description.trim();
  if (patch.features !== undefined) plan.features = patch.features.map((f) => f.trim()).filter(Boolean);
  if (patch.priceRub !== undefined) plan.priceRub = patch.priceRub;
  return plan;
}

export function listInventory(db: MockDb): InventoryRow[] {
  assertAdmin(db);
  return plansWithAvailability(db).map((plan) => {
    const accounts = db.accounts
      .filter((a) => a.planId === plan.id)
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((a) => ({
        ...a,
        assignedEmail: a.assignedTo ? db.users.find((u) => u.id === a.assignedTo)?.email ?? null : null,
      }));
    return {
      plan,
      free: accounts.filter((a) => a.status === "free").length,
      assigned: accounts.filter((a) => a.status === "assigned").length,
      blocked: accounts.filter((a) => a.status === "blocked").length,
      accounts,
    };
  });
}

export const MAX_ACCOUNTS_PER_BATCH = 20;

export function addAccounts(db: MockDb, planId: string, count: number, now: number): HermesAccount[] {
  assertAdmin(db);
  getPlanOrThrow(db, planId);
  if (!Number.isInteger(count) || count < 1 || count > MAX_ACCOUNTS_PER_BATCH)
    throw new DomainError("validation", `Можно добавить от 1 до ${MAX_ACCOUNTS_PER_BATCH} аккаунтов за раз.`, {
      count: `От 1 до ${MAX_ACCOUNTS_PER_BATCH}.`,
    });
  const added: HermesAccount[] = [];
  for (let i = 0; i < count; i++) {
    const account = makeAccount(planId, nextAccountNumber(db, planId), now);
    db.accounts.push(account);
    added.push(account);
  }
  return added;
}

export function listRequests(db: MockDb, filter: RequestFilter = {}) {
  assertAdmin(db);
  const q = filter.query?.trim().toLowerCase() ?? "";
  return db.requests
    .filter((r) => !filter.type || filter.type === "all" || r.type === filter.type)
    .filter((r) => {
      if (!q) return true;
      const haystack = [
        r.name,
        r.contact,
        r.type === "waitlist" ? `${r.planName} ${r.comment}` : `${r.company} ${r.message}`,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function setRequestStatus(db: MockDb, id: string, status: RequestStatus): void {
  assertAdmin(db);
  const request = db.requests.find((r) => r.id === id);
  if (!request) throw new DomainError("not_found", "Заявка не найдена.");
  request.status = status;
}

export function setCorporateBlock(db: MockDb, enabled: boolean): void {
  assertAdmin(db);
  db.settings.corporateBlockEnabled = enabled;
}
