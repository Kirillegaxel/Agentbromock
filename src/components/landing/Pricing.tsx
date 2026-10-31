"use client";

import Link from "next/link";
import { formatRub } from "@/domain/format";
import type { PlanWithAvailability } from "@/domain/types";
import { useMyAccess, usePlans, useSession } from "@/lib/queries";
import { cn } from "@/lib/cn";
import { PixelArt } from "../pixel/PixelArt";
import { DARK, LIGHT, planRack } from "../pixel/sprites";
import { StockMeter } from "../StockMeter";
import { buttonClass } from "../ui/Button";
import { Notice } from "../ui/Notice";
import { Skeleton } from "../ui/Skeleton";
import { SectionTitle } from "./SectionTitle";

export function Pricing() {
  const { data: plans, isPending, isError, refetch } = usePlans();
  const { data: session } = useSession();
  const { data: access } = useMyAccess(session?.role === "client");

  return (
    <section id="plans" aria-labelledby="plans-title" className="py-20">
      <SectionTitle
        id="plans-title"
        title="Тарифы"
        lead="Тарифы отличаются лимитами и приоритетом поддержки. В любой входят личный аккаунт на 30 дней, оба способа входа и инструкции по подключению."
      />

      {access && (
        <Notice tone="info" className="mt-10" title={`У вас уже есть доступ по тарифу «${access.plan.name}»`}>
          Продлить подписку можно в{" "}
          <Link href="/account" className="font-medium underline underline-offset-2">
            личном кабинете
          </Link>
          . Аккаунт при продлении останется прежним.
        </Notice>
      )}

      {isError ? (
        <Notice tone="danger" className="mt-10" title="Не удалось загрузить тарифы">
          <button type="button" onClick={() => refetch()} className="font-medium underline">
            Попробовать ещё раз
          </button>
        </Notice>
      ) : (
        <div className="mt-12 grid gap-4 lg:grid-cols-3" aria-busy={isPending}>
          {isPending
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[480px] rounded-2xl" />)
            : plans.map((plan, i) => <PlanCard key={plan.id} plan={plan} featured={i === 1} hasAccess={Boolean(access)} />)}
        </div>
      )}
      <p className="mt-6 text-sm text-muted">
        Цены и состав тарифов в прототипе условные. Подписка не продлевается автоматически — каждое продление оплачивается отдельно.
      </p>
    </section>
  );
}

function PlanCard({ plan, featured, hasAccess }: { plan: PlanWithAvailability; featured: boolean; hasAccess: boolean }) {
  const soldOut = plan.available === 0;
  const dark = featured;
  return (
    <article
      aria-labelledby={`plan-${plan.id}`}
      className={cn(
        "flex flex-col gap-7 rounded-2xl p-7 sm:p-8",
        dark ? "bg-night text-night-text" : "border border-line bg-card",
      )}
    >
      <header className="flex flex-col gap-1.5">
        <PixelArt art={planRack(Math.min(3, Math.max(1, plan.order)))} palette={dark ? DARK : LIGHT} className="mb-5 h-[52px] w-auto self-start" />
        <div className="flex items-baseline justify-between gap-3">
          <h3 id={`plan-${plan.id}`} className="text-2xl font-medium tracking-tight">
            {plan.name}
          </h3>
          {(soldOut || plan.available === 1) && (
            <span className={cn("text-sm", dark ? "text-[#e7a58b]" : "text-brand-strong")}>
              {soldOut ? "нет в наличии" : "последний"}
            </span>
          )}
        </div>
        <p className={dark ? "text-night-muted" : "text-muted"}>{plan.tagline}</p>
      </header>

      <p className="flex items-baseline gap-2">
        <span key={plan.priceRub} className="animate-rise text-[44px] leading-none font-medium tracking-[-0.03em] tabular-nums">
          {formatRub(plan.priceRub)}
        </span>
        <span className={dark ? "text-night-muted" : "text-muted"}>в месяц</span>
      </p>

      <p className={cn("font-serif text-[17px] leading-relaxed", dark ? "text-night-muted" : "text-ink/75")}>{plan.description}</p>

      <ul className="flex flex-col gap-2.5 text-[15px]">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-3">
            <svg aria-hidden viewBox="0 0 16 16" className={cn("mt-1 size-4 shrink-0", dark ? "text-[#e7a58b]" : "text-brand")}>
              <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-5">
        <StockMeter available={plan.available} dark={dark} />
        {hasAccess ? (
          <Link href="/account" className={planButton(dark, false)}>
            Продлить в кабинете
          </Link>
        ) : soldOut ? (
          <div className="flex flex-col gap-3">
            <Link href={`/waitlist/${plan.id}`} className={planButton(dark, false)}>
              Оставить заявку в очередь
            </Link>
            <p className={cn("text-[13px] leading-relaxed", dark ? "text-night-muted" : "text-muted")}>
              Свободных аккаунтов сейчас нет. Оставьте контакт — администратор свяжется с вами сам. Оплата не нужна.
            </p>
          </div>
        ) : (
          <Link href={`/buy/${plan.id}`} className={planButton(dark, true)}>
            Купить за {formatRub(plan.priceRub)}
          </Link>
        )}
      </div>
    </article>
  );
}

function planButton(dark: boolean, primary: boolean) {
  if (dark)
    return buttonClass(
      "bare",
      "md",
      primary ? "w-full bg-paper text-ink hover:bg-white" : "w-full border border-night-line text-night-text hover:bg-night-2",
    );
  return buttonClass(primary ? "primary" : "secondary", "md", "w-full");
}
