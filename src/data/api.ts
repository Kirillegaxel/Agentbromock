import type { SubscriptionView } from "@/domain/subscription";
import type {
  ContactChannel,
  HermesAccount,
  LandingSettings,
  LeadRequest,
  Payment,
  PaymentProvider,
  Plan,
  PlanId,
  RequestStatus,
  Role,
  Subscription,
  User,
} from "@/domain/types";

/**
 * Контракт между интерфейсом и источником данных.
 * Страницы и пользовательские потоки работают только с этим интерфейсом.
 * Сейчас его реализует мок (data/mock), позже — HTTP-клиент настоящего бэкенда.
 */

export interface SessionInfo {
  role: Role;
  user: Pick<User, "id" | "email" | "name"> | null;
  /** Пользователь вошёл через покупку и ещё не создал пароль. */
  needsPassword: boolean;
}

export interface MyAccess {
  subscription: Subscription;
  plan: Plan;
  account: HermesAccount;
  view: SubscriptionView;
  now: number;
}

export interface StartPurchaseInput {
  planId: PlanId;
  email: string;
  provider: PaymentProvider;
  acceptedTerms: boolean;
}

export interface WaitlistInput {
  planId: PlanId;
  name: string;
  contactChannel: ContactChannel;
  contact: string;
  comment: string;
}

export interface CorporateInput {
  company: string;
  name: string;
  contactChannel: ContactChannel;
  contact: string;
  teamSize: string;
  message: string;
}

export interface PlanPatch {
  name?: string;
  tagline?: string;
  description?: string;
  features?: string[];
  priceRub?: number;
}

export interface InventoryRow {
  plan: Plan;
  free: number;
  assigned: number;
  blocked: number;
  accounts: Array<HermesAccount & { assignedEmail: string | null }>;
}

export interface RequestFilter {
  type?: LeadRequest["type"] | "all";
  query?: string;
}

export interface HermesApi {
  // Каталог и лендинг
  listPlans(): Promise<import("@/domain/types").PlanWithAvailability[]>;
  getPlan(id: PlanId): Promise<import("@/domain/types").PlanWithAvailability | null>;
  getLandingSettings(): Promise<LandingSettings>;

  // Сессия
  getSession(): Promise<SessionInfo>;
  login(email: string, password: string): Promise<SessionInfo>;
  logout(): Promise<void>;
  /** Создать пароль после первой покупки. */
  setPassword(password: string): Promise<SessionInfo>;
  adminLogin(email: string, password: string): Promise<SessionInfo>;

  // Покупка и продление
  startPurchase(input: StartPurchaseInput): Promise<Payment>;
  startRenewal(provider: PaymentProvider): Promise<Payment>;
  getPayment(id: string): Promise<Payment | null>;

  // Личный кабинет
  getMyAccess(): Promise<MyAccess | null>;
  /** Клиент сообщает о блокировке и просит рассмотреть замену. */
  requestReview(): Promise<void>;

  // Заявки
  submitWaitlist(input: WaitlistInput): Promise<LeadRequest>;
  submitCorporate(input: CorporateInput): Promise<LeadRequest>;

  // Админка
  admin: {
    listPlans(): Promise<import("@/domain/types").PlanWithAvailability[]>;
    updatePlan(id: PlanId, patch: PlanPatch): Promise<Plan>;
    listInventory(): Promise<InventoryRow[]>;
    addAccounts(planId: PlanId, count: number): Promise<HermesAccount[]>;
    listRequests(filter?: RequestFilter): Promise<LeadRequest[]>;
    setRequestStatus(id: string, status: RequestStatus): Promise<void>;
    setCorporateBlock(enabled: boolean): Promise<LandingSettings>;
  };

  /** Уведомление о внешних изменениях данных (другая вкладка, демо-панель). */
  subscribe(listener: () => void): () => void;
}

/**
 * Имитация внешней платёжной страницы. У настоящих «Все платежи» и Wata
 * этим занимается провайдер, а результат приходит вебхуком на бэкенд.
 */
export interface PaymentGatewaySimulator {
  getPayment(id: string): Promise<Payment | null>;
  complete(id: string, outcome: "success" | "decline" | "cancel"): Promise<Payment>;
}
