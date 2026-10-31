"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ASSUMPTIONS } from "@/domain/assumptions";
import { errorMessage } from "@/domain/errors";
import { formatDate, formatRub } from "@/domain/format";
import type { PaymentProvider } from "@/domain/types";
import { api, useAction, useMyAccess, useSession } from "@/lib/queries";
import { ProviderPicker } from "../purchase/ProviderPicker";
import { Receipt } from "../purchase/Receipt";
import { Button, ButtonLink } from "../ui/Button";
import { Notice } from "../ui/Notice";
import { PageLoading } from "../ui/Skeleton";

export function RenewView() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { data: access, isPending: accessPending } = useMyAccess(session?.role === "client");
  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  const [error, setError] = useState<string>();
  const start = useAction((p: PaymentProvider) => api().startRenewal(p));

  if (isPending || (session?.role === "client" && accessPending)) return <PageLoading />;
  if (!access)
    return (
      <Notice tone="warning" title="Продлевать пока нечего">
        Войдите в кабинет с подпиской или <Link href="/#plans" className="underline">выберите тариф</Link>.
      </Notice>
    );

  const { view, plan, subscription, account } = access;
  const early = view.msLeft > 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!provider) return setError("Выберите способ оплаты.");
    try {
      const payment = await start.mutateAsync(provider);
      router.push(payment.redirectUrl);
    } catch {
      // ошибка показывается ниже
    }
  }

  if (!view.canRenew)
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <h1 className="text-4xl font-medium leading-[1.1] tracking-[-0.03em]">Продление недоступно</h1>
        <p className="leading-relaxed text-ink/80">Пока аккаунт заблокирован или рассматривается обращение, продлить подписку нельзя.</p>
        <ButtonLink href="/account" className="self-start">В кабинет</ButtonLink>
      </div>
    );

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
      <div className="flex flex-col gap-7">
        <header className="flex flex-col gap-3">
          <p className="text-sm text-muted">Продление</p>
          <h1 className="text-4xl font-medium leading-[1.1] tracking-[-0.03em]">Ещё месяц тарифа «{plan.name}»</h1>
          <p className="max-w-xl font-serif text-lg leading-relaxed text-ink/75">
            Аккаунт {account.label} останется за вами — с теми же доступами. Новый аккаунт из наличия не расходуется.
          </p>
        </header>
        <Notice tone="info" title={early ? "Оплата до окончания срока" : "Оплата после окончания срока"}>
          {early
            ? `Новые ${ASSUMPTIONS.periodDays} дней добавятся к текущей дате окончания (${formatDate(subscription.paidUntil)}). Ни один оплаченный день не потеряется.`
            : `Оплаченный срок уже закончился, поэтому новые ${ASSUMPTIONS.periodDays} дней начнутся в момент оплаты.`}
        </Notice>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          <ProviderPicker
            value={provider}
            onChange={(p) => {
              setProvider(p);
              setError(undefined);
            }}
            error={error}
          />
          {start.isError && <Notice tone="danger" role="alert">{errorMessage(start.error)}</Notice>}
          <Button type="submit" size="lg" className="self-start" loading={start.isPending} loadingText="Готовим оплату…">
            Оплатить {formatRub(plan.priceRub)}
          </Button>
        </form>
      </div>
      <aside aria-label="Предложение продления" className="lg:sticky lg:top-24 lg:self-start">
        <Receipt
          title="Продление"
          rows={[
            ["Тариф", plan.name],
            ["Аккаунт", <span key="a" className="font-mono">{account.label}</span>],
            ["Сейчас оплачено до", formatDate(subscription.paidUntil)],
            ["После оплаты — до", <strong key="u">{formatDate(view.renewedUntil)}</strong>],
          ]}
          total={["К оплате", formatRub(plan.priceRub)]}
          footer="Если оплата не пройдёт или вы её отмените, срок подписки не изменится."
        />
      </aside>
    </div>
  );
}
