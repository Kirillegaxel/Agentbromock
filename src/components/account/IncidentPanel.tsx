"use client";

import Link from "next/link";
import type { MyAccess } from "@/data/api";
import { errorMessage } from "@/domain/errors";
import { formatDateTime } from "@/domain/format";
import { api, useAction } from "@/lib/queries";
import { cn } from "@/lib/cn";
import { Button } from "../ui/Button";

const STEPS = ["Аккаунт заблокирован", "Обращение отправлено", "Проверка логов", "Решение"];

export function IncidentPanel({ access }: { access: MyAccess }) {
  const incident = access.subscription.incident;
  const report = useAction(() => api().requestReview());
  if (!incident) return null;

  const oldLabel = incident.blockedAccountId.replace(/^acc_/, "").toUpperCase();
  const stepIndex = { blocked: 0, review: 2, replaced: 3, denied: 3 }[incident.status];

  const tone =
    incident.status === "replaced"
      ? "bg-ok-soft"
      : incident.status === "review"
        ? "bg-signal-soft"
        : "bg-danger-soft";

  return (
    <section aria-labelledby="incident-title" role="region" className={cn("animate-rise rounded-2xl p-6 sm:p-8", tone)}>
      <ol aria-label="Ход рассмотрения" className="mb-6 flex flex-wrap gap-x-2 gap-y-2 text-[13px]">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-5 place-items-center rounded-full border text-[11px]",
                i <= stepIndex ? "border-ink bg-ink text-paper" : "border-ink/30 text-muted",
              )}
              aria-hidden
            >
              {i + 1}
            </span>
            <span className={cn(i <= stepIndex ? "font-medium" : "text-muted")}>{s}</span>
            {i < STEPS.length - 1 && <span aria-hidden className="mx-1 h-px w-5 bg-ink/25" />}
            <span className="sr-only">{i <= stepIndex ? "— пройдено" : "— впереди"}</span>
          </li>
        ))}
      </ol>

      {incident.status === "blocked" && (
        <div className="flex flex-col gap-3">
          <h2 id="incident-title" className="text-2xl font-medium tracking-tight">Аккаунт {oldLabel} заблокирован</h2>
          <p className="max-w-2xl leading-relaxed text-ink/85">
            Блокировка зафиксирована {formatDateTime(incident.blockedAt)}. Работать в аккаунте сейчас нельзя. Сообщите о
            блокировке — команда проверит логи использования. Если правила не нарушались, мы выдадим замену того же
            тарифа. Если нарушались — замены не будет.
          </p>
          {report.isError && <p role="alert" className="font-medium text-danger">{errorMessage(report.error)}</p>}
          <Button className="mt-2 self-start" onClick={() => report.mutate(undefined)} loading={report.isPending} loadingText="Отправляем…">
            Сообщить о блокировке
          </Button>
        </div>
      )}

      {incident.status === "review" && (
        <div className="flex flex-col gap-3" role="status">
          <h2 id="incident-title" className="text-2xl font-medium tracking-tight">Обращение рассматривается</h2>
          <p className="max-w-2xl leading-relaxed text-ink/85">
            Вы сообщили о блокировке {incident.reviewRequestedAt ? formatDateTime(incident.reviewRequestedAt) : ""}. Мы проверяем
            логи использования аккаунта {oldLabel}. Результат появится на этой странице — следить за почтой не нужно.
          </p>
          <p className="text-sm text-muted">
            Замена предоставляется, только если проверка не выявила нарушений{" "}
            <Link href="/rules" className="underline underline-offset-2">правил</Link>.
          </p>
        </div>
      )}

      {incident.status === "replaced" && (
        <div className="flex flex-col gap-3" role="status">
          <h2 id="incident-title" className="text-2xl font-medium tracking-tight">Замена предоставлена</h2>
          <p className="max-w-2xl leading-relaxed text-ink/85">{incident.decisionNote}</p>
          <p className="text-[15px]">
            Новый аккаунт: <strong className="font-mono">{access.account.label}</strong>. Прежний{" "}
            <span className="font-mono">{oldLabel}</span> больше не работает — используйте новые доступы ниже.
          </p>
        </div>
      )}

      {incident.status === "denied" && (
        <div className="flex flex-col gap-3">
          <h2 id="incident-title" className="text-2xl font-medium tracking-tight">В замене отказано</h2>
          <p className="max-w-2xl leading-relaxed text-ink/85">{incident.decisionNote}</p>
          <p className="text-[15px] text-ink/80">
            Аккаунт {oldLabel} остаётся заблокированным, продление недоступно. Подробнее о запретах — в{" "}
            <Link href="/rules" className="font-medium underline underline-offset-2">правилах использования</Link>.
          </p>
        </div>
      )}
    </section>
  );
}
