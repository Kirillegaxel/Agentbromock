import { expect, type Page } from "@playwright/test";

export async function planCard(page: Page, name: string) {
  const card = page.locator("article", { has: page.getByRole("heading", { name, exact: true }) });
  await expect(card).toBeVisible();
  return card;
}

export async function payWithCard(page: Page, kind: "success" | "decline") {
  await expect(page.getByText("Тестовая страница оплаты")).toBeVisible();
  await page.getByRole("button", { name: kind === "success" ? /оплата пройдёт/ : /банк отклонит/ }).click();
  await page.getByRole("button", { name: /^Оплатить/ }).click();
}

export async function buy(page: Page, plan: string, email: string, provider: "Все платежи" | "Wata" = "Wata") {
  await page.goto("/#plans");
  const card = await planCard(page, plan);
  await card.getByRole("link", { name: /Купить/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: new RegExp(plan) })).toBeVisible();
  await page.getByLabel("Почта").fill(email);
  await page.getByText(provider, { exact: true }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Перейти к оплате/ }).click();
}

export async function demo(page: Page, button: string | RegExp) {
  await page.getByRole("button", { name: "Демо-панель" }).click();
  const dialog = page.getByRole("dialog", { name: "Демо-панель проверяющего" });
  await dialog.getByRole("button", { name: button }).click();
  if (await dialog.isVisible()) await dialog.getByRole("button", { name: "Закрыть демо-панель" }).click();
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("Почта").fill("admin@hermes.demo");
  await page.getByLabel("Пароль").fill("hermes-admin-1");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("heading", { name: "Сводка" })).toBeVisible();
}
