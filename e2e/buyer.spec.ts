import { expect, test } from "@playwright/test";
import { buy, demo, payWithCard, planCard } from "./helpers";

test("покупка из наличия: аккаунт, пароль, кабинет, наличие уменьшилось", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Готовый аккаунт");
  await expect(page.getByText("Запустить Hermes на своём компьютере с этим аккаунтом нельзя")).toBeVisible();
  await expect((await planCard(page, "Рабочий")).getByText("4 аккаунта")).toBeVisible();

  await buy(page, "Рабочий", "new.buyer@example.com");
  await payWithCard(page, "success");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Аккаунт HM-W-\d+ закреплён за вами/);
  await page.getByRole("link", { name: "Создать пароль" }).click();
  await page.getByLabel("Пароль", { exact: true }).fill("secret123");
  await page.getByLabel("Повторите пароль").fill("secret123");
  await page.getByRole("button", { name: /Сохранить и открыть кабинет/ }).click();

  await expect(page.getByText("Подписка действует")).toBeVisible();
  await expect(page.getByText("30 дней", { exact: true })).toBeVisible();
  await expect(page.getByText("Адрес рабочего пространства", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: /BB/ }).click();
  await expect(page.getByText("Ключ доступа", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Проверить подключение" }).click();
  await expect(page.getByText(/Серверная среда отвечает/)).toBeVisible();

  await page.goto("/#plans");
  await expect((await planCard(page, "Рабочий")).getByText("3 аккаунта")).toBeVisible();

  // Повторный вход по созданному паролю
  await page.goto("/account");
  await page.getByRole("button", { name: "Выйти" }).click();
  await page.goto("/login");
  await page.getByLabel("Почта").fill("new.buyer@example.com");
  await page.getByLabel("Пароль").fill("secret123");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByText(/HM-W-\d+/).first()).toBeVisible();
});

test("отказ банка и отмена не меняют наличие; последний аккаунт открывает очередь", async ({ page }) => {
  await buy(page, "Интенсив", "a@example.com", "Все платежи");
  await payWithCard(page, "decline");
  await expect(page.getByRole("heading", { name: "Банк отклонил платёж" })).toBeVisible();
  await page.getByRole("link", { name: "Выбрать другой способ" }).click();
  await expect(page.getByLabel("Почта")).toHaveValue("a@example.com");

  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Перейти к оплате/ }).click();
  await page.getByRole("button", { name: "Отменить и вернуться в Hermes" }).click();
  await expect(page.getByRole("heading", { name: "Вы отменили оплату" })).toBeVisible();

  await page.goto("/#plans");
  const card = await planCard(page, "Интенсив");
  await expect(card.getByText("1 аккаунт")).toBeVisible();

  await buy(page, "Интенсив", "a@example.com");
  await expect(page).toHaveURL(/\/pay\//);
  const payUrl = page.url();
  await payWithCard(page, "success");
  await expect(page.getByText(/закреплён за вами/)).toBeVisible();
  // Повторное открытие страницы оплаты не списывает второй раз
  await page.goto(payUrl);
  await expect(page.getByText("Этот платёж уже обработан")).toBeVisible();

  await demo(page, /Гость/);
  await page.goto("/#plans");
  const sold = await planCard(page, "Интенсив");
  await expect(sold.getByRole("link", { name: "Оставить заявку в очередь" })).toBeVisible();
});

test("заявка в очередь проверяет поля и показывает подтверждение (клавиатура)", async ({ page }) => {
  await page.goto("/waitlist/start");
  await page.getByRole("button", { name: "Оставить заявку" }).click();
  await expect(page.getByText("Как к вам обращаться?")).toBeVisible();
  await expect(page.getByLabel("Как к вам обращаться")).toBeFocused();

  await page.keyboard.type("Ира");
  await page.getByText("Telegram", { exact: true }).click();
  await page.getByLabel("Имя пользователя в Telegram").fill("@ira_keyboard");
  await page.getByLabel("Имя пользователя в Telegram").press("Enter");
  await expect(page.getByRole("heading", { name: "Вы в очереди на тариф «Старт»" })).toBeVisible();
  await expect(page.getByText("@ira_keyboard")).toBeVisible();
});

test("продление: срок обновляется, аккаунт тот же", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Почта").fill("boris@hermes.demo");
  await page.getByLabel("Пароль").fill("demo1234");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByText("HM-W-0101").first()).toBeVisible();
  await expect(page.getByText("19 дней", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Продлить" }).click();
  await expect(page.getByText("Оплата до окончания срока")).toBeVisible();
  await page.getByText("Wata", { exact: true }).click();
  await page.getByRole("button", { name: /^Оплатить/ }).click();
  await payWithCard(page, "decline");
  await expect(page.getByRole("heading", { name: "Банк отклонил платёж" })).toBeVisible();
  await page.getByRole("button", { name: "Попробовать ещё раз" }).click();
  await payWithCard(page, "success");
  await expect(page.getByRole("heading", { name: /Подписка продлена до/ })).toBeVisible();
  await page.getByRole("link", { name: "Вернуться в кабинет" }).click();
  await expect(page.getByText("49 дней", { exact: true })).toBeVisible();
  await expect(page.getByText("HM-W-0101").first()).toBeVisible();
});

test("окончание подписки и блокировка — состояния кабинета", async ({ page }) => {
  await page.goto("/");
  await demo(page, /Глеб/);
  await expect(page.getByText("Срок закончился · аккаунт сохранён")).toBeVisible();
  await expect(page.getByText(/сохранён за вами ещё 11 дней/)).toBeVisible();
  await expect(page.getByText(/Работа приостановлена/)).toBeVisible();

  await demo(page, /Дина/);
  await expect(page.getByRole("heading", { name: /HM-W-0102 заблокирован/ })).toBeVisible();
  await page.getByRole("button", { name: "Сообщить о блокировке" }).click();
  await expect(page.getByRole("heading", { name: "Обращение рассматривается" })).toBeVisible();
  await demo(page, "Замена выдана");
  await expect(page.getByRole("heading", { name: "Замена предоставлена" })).toBeVisible();
  await expect(page.getByText("Адрес рабочего пространства", { exact: true })).toBeVisible();
  await demo(page, "Отказ в замене");
  await expect(page.getByRole("heading", { name: "В замене отказано" })).toBeVisible();
});
