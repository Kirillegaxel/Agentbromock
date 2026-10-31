/**
 * Предметные типы Hermes. Не зависят ни от источника данных, ни от интерфейса.
 * Настоящий бэкенд должен отдавать эти же формы (или адаптироваться к ним в слое data/).
 */

export type PlanId = string;
export type UserId = string;

export interface Plan {
  id: PlanId;
  /** Порядок показа на лендинге. */
  order: number;
  name: string;
  /** Короткая строка под названием. */
  tagline: string;
  description: string;
  /** Условия тарифа, по одному пункту в строке. */
  features: string[];
  /** Цена за месяц в рублях. */
  priceRub: number;
}

export interface PlanWithAvailability extends Plan {
  /** Количество свободных аккаунтов, готовых к выдаче. */
  available: number;
}

export type AccountStatus = "free" | "assigned" | "blocked";

export interface AccountCredentials {
  unowork: { workspaceUrl: string; login: string; password: string };
  bb: { host: string; user: string; accessKey: string };
}

/** Подготовленный аккаунт Hermes на VPS. */
export interface HermesAccount {
  id: string;
  planId: PlanId;
  /** Человекочитаемый номер, например HM-R-0142. */
  label: string;
  status: AccountStatus;
  assignedTo: UserId | null;
  createdAt: number;
  credentials: AccountCredentials;
}

export interface User {
  id: UserId;
  email: string;
  name: string | null;
  /** null — пароль ещё не создан (пользователь пришёл через покупку). */
  passwordHash: string | null;
  createdAt: number;
}

export type IncidentStatus = "blocked" | "review" | "replaced" | "denied";

export interface Incident {
  status: IncidentStatus;
  blockedAt: number;
  blockedAccountId: string;
  reviewRequestedAt: number | null;
  decidedAt: number | null;
  /** Текст решения для клиента (демо). */
  decisionNote: string | null;
}

export interface SubscriptionPeriod {
  paymentId: string;
  amountRub: number;
  paidAt: number;
  from: number;
  to: number;
}

export interface Subscription {
  id: string;
  userId: UserId;
  planId: PlanId;
  accountId: string;
  /** Момент первой оплаты — начало первого месяца. */
  startedAt: number;
  paidUntil: number;
  periods: SubscriptionPeriod[];
  incident: Incident | null;
}

export type PaymentProvider = "vse-platezhi" | "wata";
export type PaymentKind = "purchase" | "renewal";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "cancelled";

export type PaymentFailureReason =
  | "declined"
  | "out_of_stock"
  | "already_subscribed"
  | "renewal_unavailable";

export interface Payment {
  id: string;
  kind: PaymentKind;
  provider: PaymentProvider;
  planId: PlanId;
  /** Снимок названия и цены на момент перехода к оплате. */
  planName: string;
  amountRub: number;
  email: string;
  userId: UserId | null;
  subscriptionId: string | null;
  status: PaymentStatus;
  failureReason: PaymentFailureReason | null;
  createdAt: number;
  completedAt: number | null;
  /** Куда отправить покупателя для оплаты. В моке — страница-имитация шлюза. */
  redirectUrl: string;
  result: {
    subscriptionId: string;
    accountId: string;
    /** Нужно ли создать пароль для входа в кабинет. */
    needsPassword: boolean;
    /** Покупатель авторизован этой оплатой и может сразу открыть кабинет. */
    signedIn: boolean;
    paidUntil: number;
  } | null;
}

export type ContactChannel = "email" | "telegram" | "phone";
export type RequestStatus = "new" | "contacted";

interface RequestBase {
  id: string;
  name: string;
  contact: string;
  contactChannel: ContactChannel;
  createdAt: number;
  status: RequestStatus;
}

export interface WaitlistRequest extends RequestBase {
  type: "waitlist";
  planId: PlanId;
  /** Название тарифа на момент заявки. */
  planName: string;
  comment: string;
}

export interface CorporateRequest extends RequestBase {
  type: "corporate";
  company: string;
  teamSize: string;
  message: string;
}

export type LeadRequest = WaitlistRequest | CorporateRequest;

export interface LandingSettings {
  corporateBlockEnabled: boolean;
}

export type Role = "guest" | "client" | "admin";
