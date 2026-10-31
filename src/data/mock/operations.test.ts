import { beforeEach, describe, expect, it } from "vitest";
import { DAY_MS } from "@/domain/assumptions";
import { DomainError } from "@/domain/errors";
import { createDemoControls } from "../demo/demoControls";
import { createMockApi } from "./mockApi";
import { DEMO_ADMIN, DEMO_PASSWORD } from "./seed";
import { MockStore, memoryStorage } from "./store";

let clock = Date.UTC(2026, 9, 1, 12);
let store: MockStore;
let api: ReturnType<typeof createMockApi>["api"];
let gateway: ReturnType<typeof createMockApi>["gateway"];
let demo: ReturnType<typeof createDemoControls>;

const available = async (planId: string) => (await api.getPlan(planId))!.available;

beforeEach(() => {
  clock = Date.UTC(2026, 9, 1, 12);
  store = new MockStore(memoryStorage(), () => clock);
  ({ api, gateway } = createMockApi(store));
  demo = createDemoControls(store);
});

describe("исходные данные", () => {
  it("один тариф без наличия и один с последним аккаунтом", async () => {
    const plans = await api.listPlans();
    expect(plans.map((p) => [p.id, p.available])).toEqual([
      ["start", 0],
      ["work", 4],
      ["intensive", 1],
    ]);
  });
});

describe("покупка", () => {
  it("успех закрепляет ровно один аккаунт и начинает месяц с момента оплаты", async () => {
    const payment = await api.startPurchase({ planId: "work", email: "New@Example.com", provider: "wata", acceptedTerms: true });
    expect(payment.status).toBe("pending");
    expect(await available("work")).toBe(4);

    const done = await gateway.complete(payment.id, "success");
    expect(done.status).toBe("succeeded");
    expect(done.result?.needsPassword).toBe(true);
    expect(done.result?.paidUntil).toBe(clock + 30 * DAY_MS);
    expect(await available("work")).toBe(3);

    const access = await api.getMyAccess();
    expect(access?.account.id).toBe(done.result?.accountId);
    expect(access?.account.status).toBe("assigned");
    expect(access?.subscription.startedAt).toBe(clock);
    expect((await api.getSession()).user?.email).toBe("new@example.com");
  });

  it("повторное подтверждение не списывает наличие второй раз", async () => {
    const payment = await api.startPurchase({ planId: "work", email: "a@example.com", provider: "wata", acceptedTerms: true });
    await gateway.complete(payment.id, "success");
    await gateway.complete(payment.id, "success");
    await gateway.complete(payment.id, "decline");
    expect(await available("work")).toBe(3);
    expect(store.read().subscriptions.filter((s) => s.planId === "work" && s.userId.startsWith("u_0"))).toHaveLength(1);
  });

  it.each(["decline", "cancel"] as const)("%s не назначает аккаунт и не меняет наличие", async (outcome) => {
    const payment = await api.startPurchase({ planId: "intensive", email: "b@example.com", provider: "vse-platezhi", acceptedTerms: true });
    const done = await gateway.complete(payment.id, outcome);
    expect(done.status).toBe(outcome === "decline" ? "failed" : "cancelled");
    expect(await available("intensive")).toBe(1);
    expect(await api.getMyAccess()).toBeNull();
    expect(store.read().users.some((u) => u.email === "b@example.com")).toBe(false);
  });

  it("последний аккаунт переводит тариф в очередь, повторная покупка невозможна", async () => {
    const p = await api.startPurchase({ planId: "intensive", email: "c@example.com", provider: "wata", acceptedTerms: true });
    await gateway.complete(p.id, "success");
    expect(await available("intensive")).toBe(0);
    await api.logout();
    await expect(
      api.startPurchase({ planId: "intensive", email: "d@example.com", provider: "wata", acceptedTerms: true }),
    ).rejects.toMatchObject({ code: "out_of_stock" });
  });

  it("если аккаунт успели купить, оплата не проходит и наличие не уходит в минус", async () => {
    const first = await api.startPurchase({ planId: "intensive", email: "e@example.com", provider: "wata", acceptedTerms: true });
    const second = await api.startPurchase({ planId: "intensive", email: "f@example.com", provider: "wata", acceptedTerms: true });
    await gateway.complete(first.id, "success");
    const late = await gateway.complete(second.id, "success");
    expect(late.status).toBe("failed");
    expect(late.failureReason).toBe("out_of_stock");
    expect(await available("intensive")).toBe(0);
    const owners = store.read().accounts.filter((a) => a.planId === "intensive").map((a) => a.assignedTo);
    expect(new Set(owners).size).toBe(owners.length);
  });

  it("сумма покупки фиксируется в момент перехода к оплате", async () => {
    demo.signInAs("admin");
    await api.admin.updatePlan("work", { priceRub: 7777 });
    await api.logout();
    const p = await api.startPurchase({ planId: "work", email: "g@example.com", provider: "wata", acceptedTerms: true });
    demo.signInAs("admin");
    await api.admin.updatePlan("work", { priceRub: 9999 });
    await api.logout();
    const done = await gateway.complete(p.id, "success");
    expect(done.amountRub).toBe(7777);
    expect(store.read().subscriptions.find((s) => s.id === done.subscriptionId)?.periods[0].amountRub).toBe(7777);
    expect(await available("work")).toBe(3);
  });

  it("проверяет поля и запрещает вторую подписку на ту же почту", async () => {
    await expect(
      api.startPurchase({ planId: "work", email: "плохо", provider: "wata", acceptedTerms: false }),
    ).rejects.toBeInstanceOf(DomainError);
    await expect(
      api.startPurchase({ planId: "work", email: "boris@hermes.demo", provider: "wata", acceptedTerms: true }),
    ).rejects.toMatchObject({ code: "already_subscribed" });
  });

  it("покупка на почту существующего пользователя не открывает его кабинет без пароля", async () => {
    const p = await api.startPurchase({ planId: "work", email: "anna@hermes.demo", provider: "wata", acceptedTerms: true });
    const done = await gateway.complete(p.id, "success");
    expect(done.result?.signedIn).toBe(false);
    expect((await api.getSession()).role).toBe("guest");
    await api.login("anna@hermes.demo", DEMO_PASSWORD);
    expect((await api.getMyAccess())?.plan.id).toBe("work");
  });
});

describe("продление", () => {
  beforeEach(() => demo.signInAs("boris"));

  it("досрочная оплата добавляет месяц к дате окончания и сохраняет аккаунт", async () => {
    const before = (await api.getMyAccess())!;
    const freeBefore = await available("work");
    const p = await api.startRenewal("wata");
    expect(p.amountRub).toBe(before.plan.priceRub);
    await gateway.complete(p.id, "success");
    const after = (await api.getMyAccess())!;
    expect(after.subscription.paidUntil).toBe(before.subscription.paidUntil + 30 * DAY_MS);
    expect(after.account.id).toBe(before.account.id);
    expect(await available("work")).toBe(freeBefore);
  });

  it("после окончания срока месяц отсчитывается от момента оплаты", async () => {
    demo.signInAs("gleb");
    const before = (await api.getMyAccess())!;
    expect(before.view.phase).toBe("grace");
    expect(before.view.access).toBe("paused_unpaid");
    const p = await api.startRenewal("vse-platezhi");
    await gateway.complete(p.id, "success");
    const after = (await api.getMyAccess())!;
    expect(after.subscription.paidUntil).toBe(clock + 30 * DAY_MS);
    expect(after.view.phase).toBe("active");
    expect(after.account.id).toBe(before.account.id);
  });

  it.each(["decline", "cancel"] as const)("%s не меняет срок", async (outcome) => {
    const before = (await api.getMyAccess())!.subscription.paidUntil;
    const p = await api.startRenewal("wata");
    await gateway.complete(p.id, outcome);
    await gateway.complete(p.id, "success");
    expect((await api.getMyAccess())!.subscription.paidUntil).toBe(before);
  });
});

describe("окончание подписки", () => {
  it("истечение не возвращает аккаунт в продажу", async () => {
    demo.signInAs("boris");
    clock += 60 * DAY_MS;
    const access = (await api.getMyAccess())!;
    expect(access.view.phase).toBe("storage_over");
    expect(access.account.status).toBe("assigned");
    expect(await available("work")).toBe(4);
  });
});

describe("блокировка", () => {
  it("рассмотрение, замена из наличия того же тарифа, срок не меняется", async () => {
    demo.signInAs("dina");
    const before = (await api.getMyAccess())!;
    expect(before.view.access).toBe("blocked");
    await expect(api.startRenewal("wata")).rejects.toMatchObject({ code: "renewal_unavailable" });
    await api.requestReview();
    expect((await api.getMyAccess())!.view.access).toBe("review");
    demo.setIncident("replaced");
    const after = (await api.getMyAccess())!;
    expect(after.account.id).not.toBe(before.account.id);
    expect(after.subscription.paidUntil).toBe(before.subscription.paidUntil);
    expect(after.view.access).toBe("ok");
    expect(store.read().accounts.find((a) => a.id === before.account.id)?.status).toBe("blocked");
  });

  it("отказ не выдаёт новый аккаунт", async () => {
    demo.signInAs("dina");
    const free = await available("work");
    demo.setIncident("denied");
    const after = (await api.getMyAccess())!;
    expect(after.view.access).toBe("denied");
    expect(await available("work")).toBe(free);
  });
});

describe("заявки", () => {
  it("заявка в очередь появляется в админке и не создаёт оплату", async () => {
    const paymentsBefore = store.read().payments.length;
    await api.submitWaitlist({ planId: "start", name: "Ира", contactChannel: "telegram", contact: "@ira_test", comment: "" });
    expect(store.read().payments.length).toBe(paymentsBefore);
    await api.adminLogin(DEMO_ADMIN.email, DEMO_ADMIN.password);
    const list = await api.admin.listRequests({ type: "waitlist", query: "ira_test" });
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ type: "waitlist", planId: "start" });
  });

  it("проверяет обязательные поля", async () => {
    await expect(
      api.submitWaitlist({ planId: "start", name: "", contactChannel: "email", contact: "нет", comment: "" }),
    ).rejects.toMatchObject({ code: "validation", fields: { name: expect.any(String), contact: expect.any(String) } });
  });

  it("корпоративная заявка невозможна при выключенном блоке", async () => {
    demo.signInAs("admin");
    await api.admin.setCorporateBlock(false);
    expect((await api.getLandingSettings()).corporateBlockEnabled).toBe(false);
    await expect(
      api.submitCorporate({ company: "Демо", name: "Ян", contactChannel: "email", contact: "yan@example.com", teamSize: "2–5", message: "Привет" }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });
});

describe("админка", () => {
  beforeEach(async () => {
    await api.adminLogin(DEMO_ADMIN.email, DEMO_ADMIN.password);
  });

  it("пополнение открывает продажу, но не трогает заявки", async () => {
    const requestsBefore = store.read().requests.length;
    await api.admin.addAccounts("start", 3);
    expect(await available("start")).toBe(3);
    expect(store.read().requests.length).toBe(requestsBefore);
    expect(store.read().requests.every((r) => r.status !== "contacted" || r.id === "req_s2")).toBe(true);
    const ids = store.read().accounts.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("цена меняется и видна на лендинге", async () => {
    await api.admin.updatePlan("start", { priceRub: 3100, description: "Новое описание" });
    expect((await api.getPlan("start"))?.priceRub).toBe(3100);
    await expect(api.admin.updatePlan("start", { priceRub: 5 })).rejects.toMatchObject({ code: "validation" });
  });

  it("закрыта для клиентов", async () => {
    demo.signInAs("boris");
    await expect(api.admin.listRequests()).rejects.toMatchObject({ code: "forbidden" });
  });
});

describe("демо", () => {
  it("сброс возвращает исходные данные", async () => {
    demo.signInAs("admin");
    await api.admin.addAccounts("start", 2);
    demo.clearRequests();
    demo.shiftClock(10);
    demo.reset();
    expect(await available("start")).toBe(0);
    expect(store.read().requests.length).toBe(5);
    expect(store.read().clockOffsetMs).toBe(0);
    expect((await api.getSession()).role).toBe("guest");
  });
});
