import type { ContactChannel, PaymentProvider } from "./types";

export const PROVIDERS: Record<PaymentProvider, { name: string; note: string }> = {
  "vse-platezhi": {
    name: "Все платежи",
    note: "Карта российского банка или СБП",
  },
  wata: {
    name: "Wata",
    note: "Карта или СБП через платёжную страницу Wata",
  },
};

export const CONTACT_CHANNELS: Record<ContactChannel, { label: string; field: string; placeholder: string }> = {
  email: { label: "Почта", field: "Адрес почты", placeholder: "name@example.com" },
  telegram: { label: "Telegram", field: "Имя пользователя в Telegram", placeholder: "@username" },
  phone: { label: "Телефон", field: "Номер телефона", placeholder: "+7 900 123-45-67" },
};
