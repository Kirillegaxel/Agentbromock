import { expect, test } from "@playwright/test";
import { loginAsAdmin, planCard } from "./helpers";

test("цена, наличие и корпоративный блок отражаются на лендинге", async ({ page }) => {
  await loginAsAdmin(page);

  await page.getByRole("link", { name: "Тарифы и цены" }).first().click();
  const form = page.locator("form", { has: page.getByRole("heading", { name: "Старт" }) });
  await form.getByLabel("Цена за месяц, ₽").fill("3300");
  await form.getByRole("button", { name: "Сохранить" }).click();
  await expect(form.getByText("Сохранено")).toBeVisible();

  await page.getByRole("link", { name: "Наличие" }).first().click();
  const start = page.locator("section", { has: page.getByRole("heading", { name: "Старт", exact: true }) });
  await start.getByLabel("Добавить аккаунтов").selectOption("3");
  await start.getByRole("button", { name: "Пополнить" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Добавить" }).click();
  await expect(start.getByText("Наличие пополнено")).toBeVisible();
  await expect(start.getByText(/В очереди на этот тариф 2/)).toBeVisible();

  await page.goto("/#plans");
  const card = await planCard(page, "Старт");
  await expect(card.getByText("3 аккаунта")).toBeVisible();
  await expect(card.getByRole("link", { name: /Купить за 3\s300/ })).toBeVisible();

  await page.goto("/admin/landing");
  await page.getByRole("switch").click();
  await page.getByRole("dialog").getByRole("button", { name: "Скрыть" }).click();
  await expect(page.getByRole("status").getByText("Блок скрыт.")).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Аккаунты для команды" })).toHaveCount(0);
});

test("корпоративная заявка и заявка в очередь видны в админке, поиск и пустое состояние", async ({ page }) => {
  await page.goto("/#teams");
  await page.getByRole("button", { name: "Оставить заявку" }).click();
  const dialog = page.getByRole("dialog", { name: "Заявка для команды" });
  await dialog.getByRole("button", { name: "Отправить" }).click();
  await expect(dialog.getByText("Укажите название компании или команды.")).toBeVisible();
  await expect(dialog.getByLabel("Компания или команда", { exact: true })).toBeFocused();
  await page.getByLabel("Компания или команда", { exact: true }).fill("Тестовая студия");
  await page.getByLabel("Как к вам обращаться", { exact: true }).fill("Ян");
  await page.getByLabel("Адрес почты").fill("yan@example.com");
  await page.getByLabel("Сколько человек в команде", { exact: true }).selectOption("6–15");
  await page.getByLabel("Что нужно команде").fill("Пять разработчиков, один проект");
  await dialog.getByRole("button", { name: "Отправить" }).click();
  await expect(page.getByText(/Спасибо, Ян!/)).toBeVisible();
  await page.getByRole("button", { name: "Закрыть", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "Оставить заявку" })).toBeFocused();

  await loginAsAdmin(page);
  await page.goto("/admin/requests");
  await page.getByText(/^Корпоративные/).click();
  await page.getByLabel("Поиск").fill("Тестовая");
  const item = page.getByRole("button", { name: /Тестовая студия/ });
  await item.click();
  await expect(page.getByText("Пять разработчиков, один проект")).toBeVisible();
  await page.getByRole("button", { name: "Отметить: связались" }).click();
  await expect(page.getByRole("button", { name: "Вернуть в новые" })).toBeVisible();

  await page.getByRole("button", { name: "Демо-панель" }).click();
  await page.getByRole("button", { name: /Очистить все/ }).click();
  await page.getByRole("button", { name: "Закрыть демо-панель" }).click();
  await expect(page.getByText("Заявок пока нет")).toBeVisible();
});
