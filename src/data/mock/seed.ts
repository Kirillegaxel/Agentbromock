import { DAY_MS } from "@/domain/assumptions";
import type {
  HermesAccount,
  LeadRequest,
  Plan,
  PlanId,
  Subscription,
  User,
} from "@/domain/types";
import { demoHash, MOCK_DB_VERSION, type MockDb } from "./db";

export const DEMO_PASSWORD = "demo1234";
export const DEMO_ADMIN = { email: "admin@hermes.demo", password: "hermes-admin-1" };

/** Демо-пользователи, между которыми переключается проверяющий. */
export const DEMO_USERS = {
  anna: { id: "u_anna", email: "anna@hermes.demo", name: "Анна", hint: "Без покупки" },
  boris: { id: "u_boris", email: "boris@hermes.demo", name: "Борис", hint: "Подписка действует" },
  vera: { id: "u_vera", email: "vera@hermes.demo", name: "Вера", hint: "Подписка скоро закончится" },
  gleb: { id: "u_gleb", email: "gleb@hermes.demo", name: "Глеб", hint: "Срок закончился, аккаунт сохранён" },
  dina: { id: "u_dina", email: "dina@hermes.demo", name: "Дина", hint: "Аккаунт заблокирован" },
} as const;

const PLAN_PREFIX: Record<PlanId, string> = { start: "S", work: "W", intensive: "I" };

export const SEED_PLANS: Plan[] = [
  {
    id: "start",
    order: 1,
    name: "Старт",
    tagline: "Чтобы спокойно попробовать",
    description:
      "Для первых проектов и знакомства с работой ИИ над кодом. Хватает на несколько вечеров в неделю.",
    features: [
      "Личный аккаунт на 30 дней",
      "Доступ через UnoWork и BB",
      "Базовый лимит запросов",
      "Инструкции по подключению",
    ],
    priceRub: 2900,
  },
  {
    id: "work",
    order: 2,
    name: "Рабочий",
    tagline: "Для ежедневной работы",
    description:
      "Для тех, кто работает с ИИ каждый день: прототипы, правки в продукте, разбор чужого кода.",
    features: [
      "Личный аккаунт на 30 дней",
      "Доступ через UnoWork и BB",
      "Расширенный лимит запросов",
      "Приоритет в ответах поддержки",
    ],
    priceRub: 5900,
  },
  {
    id: "intensive",
    order: 3,
    name: "Интенсив",
    tagline: "Когда ИИ — основной инструмент",
    description:
      "Для плотной работы: длинные сессии, несколько проектов параллельно, большие кодовые базы.",
    features: [
      "Личный аккаунт на 30 дней",
      "Доступ через UnoWork и BB",
      "Максимальный лимит запросов",
      "Приоритет в ответах поддержки",
    ],
    priceRub: 11900,
  },
];

function pseudo(seed: number, len: number): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let x = (seed * 2654435761) >>> 0;
  let out = "";
  for (let i = 0; i < len; i++) {
    x = (Math.imul(x ^ (x >>> 15), 2246822507) + i * 97) >>> 0;
    out += alphabet[x % alphabet.length];
  }
  return out;
}

/** Создаёт вымышленный подготовленный аккаунт. Никаких реальных доступов. */
export function makeAccount(planId: PlanId, number: number, createdAt: number): HermesAccount {
  const prefix = PLAN_PREFIX[planId] ?? "X";
  const code = `hm-${prefix.toLowerCase()}-${String(number).padStart(4, "0")}`;
  return {
    id: `acc_${code}`,
    planId,
    label: code.toUpperCase(),
    status: "free",
    assignedTo: null,
    createdAt,
    credentials: {
      unowork: {
        workspaceUrl: `https://${code}.unowork.demo`,
        login: `${code}@workspace.demo`,
        password: `demo-${pseudo(number * 7 + 1, 8)}`,
      },
      bb: {
        host: `${code}.bb.demo`,
        user: "hermes",
        accessKey: `bb_demo_${pseudo(number * 13 + 5, 16)}`,
      },
    },
  };
}

/** Номер для следующего аккаунта тарифа. */
export function nextAccountNumber(db: MockDb, planId: PlanId): number {
  const prefix = `acc_hm-${(PLAN_PREFIX[planId] ?? "X").toLowerCase()}-`;
  const numbers = db.accounts
    .filter((a) => a.id.startsWith(prefix))
    .map((a) => Number(a.id.slice(prefix.length)));
  return (numbers.length ? Math.max(...numbers) : 100) + 1;
}

export function sampleRequests(now: number): LeadRequest[] {
  return [
    {
      id: "req_s1",
      type: "waitlist",
      planId: "start",
      planName: "Старт",
      name: "Мира",
      contactChannel: "telegram",
      contact: "@mira_builds",
      comment: "Хочу попробовать собрать первый сервис. Удобнее писать в Telegram вечером.",
      createdAt: now - 2 * DAY_MS - 3 * 3600_000,
      status: "new",
    },
    {
      id: "req_s2",
      type: "waitlist",
      planId: "start",
      planName: "Старт",
      name: "Тимур",
      contactChannel: "email",
      contact: "timur.k@example.com",
      comment: "",
      createdAt: now - DAY_MS - 5 * 3600_000,
      status: "contacted",
    },
    {
      id: "req_s3",
      type: "waitlist",
      planId: "start",
      planName: "Старт",
      name: "Ольга",
      contactChannel: "phone",
      contact: "+7 900 000-41-27",
      comment: "Продакт, кода пишу мало — нужен понятный старт.",
      createdAt: now - 4 * 3600_000,
      status: "new",
    },
    {
      id: "req_c1",
      type: "corporate",
      company: "Студия «Северный ветер» (демо)",
      name: "Лев",
      contactChannel: "email",
      contact: "lev@severny-veter.example",
      teamSize: "6–15",
      message:
        "Нужны доступы для команды разработки, 8 человек. Интересует, как устроено продление сразу на всех.",
      createdAt: now - 3 * DAY_MS,
      status: "new",
    },
    {
      id: "req_c2",
      type: "corporate",
      company: "ООО «Пример Плюс» (демо)",
      name: "Карина",
      contactChannel: "telegram",
      contact: "@karina_ops",
      teamSize: "2–5",
      message: "Небольшая продуктовая команда, хотим попробовать на одном проекте.",
      createdAt: now - 7 * 3600_000,
      status: "new",
    },
  ];
}

export function createSeed(now: number): MockDb {
  const users: User[] = Object.values(DEMO_USERS).map((u, i) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    passwordHash: demoHash(DEMO_PASSWORD),
    createdAt: now - (60 - i) * DAY_MS,
  }));

  const created = now - 45 * DAY_MS;
  const accounts: HermesAccount[] = [
    // Старт: свободных нет — тариф в режиме «очередь».
    makeAccount("start", 101, created),
    makeAccount("start", 102, created),
    // Рабочий: четыре свободных.
    makeAccount("work", 101, created),
    makeAccount("work", 102, created),
    makeAccount("work", 103, created),
    makeAccount("work", 104, created),
    makeAccount("work", 105, created),
    makeAccount("work", 106, created),
    // Интенсив: остался последний свободный.
    makeAccount("intensive", 101, created),
    makeAccount("intensive", 102, created),
  ];
  const byId = (id: string) => accounts.find((a) => a.id === id)!;
  const assign = (id: string, userId: string, status: HermesAccount["status"] = "assigned") => {
    const acc = byId(id);
    acc.status = status;
    acc.assignedTo = userId;
  };
  assign("acc_hm-s-0101", DEMO_USERS.gleb.id);
  assign("acc_hm-s-0102", "u_offline_1");
  assign("acc_hm-w-0101", DEMO_USERS.boris.id);
  assign("acc_hm-w-0102", DEMO_USERS.dina.id, "blocked");
  assign("acc_hm-i-0101", DEMO_USERS.vera.id);

  // Клиент без демо-входа: нужен, чтобы у «Старта» не было свободных аккаунтов.
  users.push({
    id: "u_offline_1",
    email: "client-0042@example.com",
    name: null,
    passwordHash: demoHash(`${now}-locked`),
    createdAt: now - 20 * DAY_MS,
  });

  const sub = (
    id: string,
    userId: string,
    planId: PlanId,
    accountId: string,
    priceRub: number,
    paidUntil: number,
    months = 1,
  ): Subscription => {
    const periods = Array.from({ length: months }, (_, i) => {
      const to = paidUntil - (months - 1 - i) * 30 * DAY_MS;
      const from = to - 30 * DAY_MS;
      return { paymentId: `pay_seed_${id}_${i}`, amountRub: priceRub, paidAt: from, from, to };
    });
    return {
      id,
      userId,
      planId,
      accountId,
      startedAt: periods[0].from,
      paidUntil,
      periods,
      incident: null,
    };
  };

  const subscriptions: Subscription[] = [
    sub("sub_boris", DEMO_USERS.boris.id, "work", "acc_hm-w-0101", 5900, now + 19 * DAY_MS),
    sub("sub_vera", DEMO_USERS.vera.id, "intensive", "acc_hm-i-0101", 11900, now + 2 * DAY_MS, 2),
    sub("sub_gleb", DEMO_USERS.gleb.id, "start", "acc_hm-s-0101", 2900, now - 3 * DAY_MS),
    sub("sub_offline_1", "u_offline_1", "start", "acc_hm-s-0102", 2900, now + 9 * DAY_MS),
    {
      ...sub("sub_dina", DEMO_USERS.dina.id, "work", "acc_hm-w-0102", 5900, now + 12 * DAY_MS),
      incident: {
        status: "blocked",
        blockedAt: now - 2 * 3600_000,
        blockedAccountId: "acc_hm-w-0102",
        reviewRequestedAt: null,
        decidedAt: null,
        decisionNote: null,
      },
    },
  ];

  return {
    version: MOCK_DB_VERSION,
    seq: 1000,
    clockOffsetMs: 0,
    plans: structuredClone(SEED_PLANS),
    accounts,
    users,
    subscriptions,
    payments: [],
    requests: sampleRequests(now),
    settings: { corporateBlockEnabled: true },
    session: { role: "guest", userId: null },
    admin: { email: DEMO_ADMIN.email, passwordHash: demoHash(DEMO_ADMIN.password) },
  };
}
