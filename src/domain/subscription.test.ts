import { describe, expect, it } from "vitest";
import { DAY_MS } from "./assumptions";
import { describeSubscription, getPhase, nextPaidUntil } from "./subscription";
import { validateContact, validatePrice } from "./validation";
import { plural } from "./format";

const now = Date.UTC(2026, 0, 10);

describe("фазы подписки", () => {
  it.each([
    [20, "active"],
    [5, "expiring"],
    [1, "expiring"],
    [-1, "grace"],
    [-13, "grace"],
    [-15, "storage_over"],
  ] as const)("%i дней → %s", (d, phase) => {
    expect(getPhase(now + d * DAY_MS, now)).toBe(phase);
  });

  it("в период сохранения работа приостановлена, продление доступно", () => {
    const v = describeSubscription({ paidUntil: now - DAY_MS, incident: null }, now);
    expect(v.access).toBe("paused_unpaid");
    expect(v.canRenew).toBe(true);
    expect(v.graceDaysLeft).toBe(13);
  });
});

describe("правило продления", () => {
  it("досрочно — от даты окончания, после окончания — от оплаты", () => {
    expect(nextPaidUntil(now + 3 * DAY_MS, now)).toBe(now + 33 * DAY_MS);
    expect(nextPaidUntil(now - 3 * DAY_MS, now)).toBe(now + 30 * DAY_MS);
  });
});

describe("валидация и форматирование", () => {
  it("контакты", () => {
    expect(validateContact("telegram", "@good_name")).toBeUndefined();
    expect(validateContact("telegram", "x")).toBeDefined();
    expect(validateContact("phone", "+7 900 123-45-67")).toBeUndefined();
    expect(validateContact("email", "")).toBeDefined();
  });
  it("цена", () => {
    expect(validatePrice("4900")).toBeUndefined();
    expect(validatePrice("49.5")).toBeDefined();
  });
  it("склонения", () => {
    expect([1, 2, 5, 11, 21, 22].map((n) => plural(n, ["день", "дня", "дней"]))).toEqual([
      "день", "дня", "дней", "дней", "день", "дня",
    ]);
  });
});
