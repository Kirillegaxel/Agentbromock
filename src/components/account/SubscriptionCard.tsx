"use client";

import { ASSUMPTIONS, DAY_MS } from "@/domain/assumptions";
import { days, formatDate } from "@/domain/format";
import type { MyAccess } from "@/data/api";
import { cn } from "@/lib/cn";
import { Badge } from "../ui/Badge";
import { ButtonLink } from "../ui/Button";
import { Notice } from "../ui/Notice";

export function SubscriptionCard({ access }: { access: MyAccess }) {
  const { subscription: sub, plan, account, view, now } = access;
  const periodStart = sub.periods[sub.periods.length - 1]?.from ?? sub.startedAt;
  const total = Math.max(DAY_MS, sub.paidUntil - periodStart);
  const progress = Math.min(1, Math.max(0, (now - periodStart) / total));
  const incident = sub.incident?.status;
  const blocked = incident === "blocked" || incident === "review" || incident === "denied";

  const status = blocked
    ? { label: incident === "denied" ? "Замена не предоставлена" : "Аккаунт заблокирован", tone: "danger" as const }
    : view.phase === "active"
      ? { label: "Подписка действует", tone: "ok" as const }
      : view.phase === "expiring"
        ? { label: "Скоро закончится", tone: "signal" as const }
        : view.phase === "grace"
          ? { label: "Срок закончился · аккаунт сохранён", tone: "signal" as const }
          : { label: "Срок хранения закончился", tone: "danger" as const };

  return (
    <section aria-labelledby="sub-title" className="grid overflow-hidden rounded-2xl border border-line bg-card md:grid-cols-[1.2fr_1fr]">
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={status.tone}>
            <span aria-hidden className={cn("size-1.5 rounded-full bg-current", view.phase === "active" && !blocked && "")} />
            {status.label}
          </Badge>
          <span className="text-sm text-muted">тариф «{plan.name}»</span>
        </div>
        <div>
          <h2 id="sub-title" className="sr-only">Аккаунт и подписка</h2>
          <p className="text-sm text-muted">Ваш аккаунт</p>
          <p className="font-mono text-3xl font-medium tracking-tight sm:text-[34px]">{account.label}</p>
          <p className="mt-1 text-sm text-muted">Закреплён только за вами · работает на сервере Hermes</p>
        </div>

        {!blocked && view.phase === "expiring" && (
          <Notice tone="warning" title={`Подписка закончится через ${days(view.daysLeft)} — ${formatDate(sub.paidUntil)}`}>
            Продлите заранее: новый месяц добавится к текущей дате окончания, ни один день не потеряется.
          </Notice>
        )}
        {!blocked && view.phase === "grace" && (
          <Notice tone="warning" title={`Оплаченный срок закончился ${formatDate(sub.paidUntil)}`}>
            Аккаунт {account.label} сохранён за вами ещё {days(view.graceDaysLeft)} — до {formatDate(view.graceEndsAt)}.
            {ASSUMPTIONS.workDuringGrace ? "" : " Работа в нём приостановлена до оплаты."} Продлите подписку, чтобы
            продолжить — аккаунт останется тем же. Новый месяц начнётся в момент оплаты.
          </Notice>
        )}
        {!blocked && view.phase === "storage_over" && (
          <Notice tone="danger" title={`Срок хранения аккаунта закончился ${formatDate(view.graceEndsAt)}`}>
            Пока аккаунт всё ещё закреплён за вами, но команда может вернуть его в продажу. Продлите подписку, чтобы
            сохранить его.
          </Notice>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-3">
          {view.canRenew ? (
            <ButtonLink href="/account/renew" size="lg" variant={view.phase === "active" ? "secondary" : "primary"}>
              Продлить
            </ButtonLink>
          ) : (
            <p className="text-sm text-muted">Продление недоступно, пока не решён вопрос с блокировкой.</p>
          )}
        </div>
      </div>

      <dl className="flex flex-col justify-between gap-5 bg-sand/60 p-6 sm:p-8">
        <div>
          <dt className="text-sm text-muted">{view.msLeft > 0 ? "Осталось" : "Оплата закончилась"}</dt>
          <dd className="text-4xl font-medium tracking-[-0.03em] tabular-nums">
            {view.msLeft > 0 ? days(view.daysLeft) : `${days(Math.floor(-view.msLeft / DAY_MS))} назад`}
          </dd>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10"
            role="progressbar"
            aria-label="Прошло от текущего оплаченного периода"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <div
              className={cn("h-full rounded-full transition-[width] duration-700", view.phase === "active" ? "bg-ink" : view.phase === "expiring" ? "bg-brand" : "bg-danger")}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-[15px]">
          <div>
            <dt className="text-sm text-muted">Оплачено до</dt>
            <dd className="font-medium">{formatDate(sub.paidUntil)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">С нами с</dt>
            <dd className="font-medium">{formatDate(sub.startedAt)}</dd>
          </div>
        </div>
      </dl>
    </section>
  );
}
