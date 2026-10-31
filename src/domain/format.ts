const rub = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

export function formatRub(value: number): string {
  return rub.format(value);
}

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(ts: number): string {
  return dateFmt.format(ts);
}

export function formatDateTime(ts: number): string {
  return dateTimeFmt.format(ts);
}

/** plural(5, ["день", "дня", "дней"]) → "дней" */
export function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}

export function days(n: number): string {
  return `${n} ${plural(n, ["день", "дня", "дней"])}`;
}

export function accounts(n: number): string {
  return `${n} ${plural(n, ["аккаунт", "аккаунта", "аккаунтов"])}`;
}
