"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorMessage } from "@/domain/errors";
import { formatDate, formatDateTime, formatRub } from "@/domain/format";
import { PROVIDERS } from "@/domain/labels";
import type { Payment } from "@/domain/types";
import { api, useAction, usePayment } from "@/lib/queries";
import { Button, ButtonLink } from "../ui/Button";
import { Notice } from "../ui/Notice";
import { PageLoading } from "../ui/Skeleton";
import { Receipt } from "./Receipt";

export function PaymentResultView({ paymentId }: { paymentId: string }) {
  const { data: payment, isPending } = usePayment(paymentId);
  if (isPending) return <PageLoading label="Проверяем оплату…" />;
  if (!payment)
    return (
      <Notice tone="warning" title="Платёж не найден">
        Возможно, демо было сброшено. <Link href="/#plans" className="underline">Вернуться к тарифам</Link>
      </Notice>
    );
  if (payment.status === "succeeded") return <Success payment={payment} />;
  if (payment.status === "pending")
    return (
      <Shell kicker="Ожидает оплаты" title="Платёж ещё не завершён">
        <p className="leading-relaxed text-ink/80">Оплата не подтверждена. Аккаунт закрепится за вами только после успешной оплаты.</p>
        <ButtonLink href={payment.redirectUrl} className="self-start">Продолжить оплату</ButtonLink>
      </Shell>
    );
  return <Unsuccessful payment={payment} />;
}

function Shell({ kicker, title, tone = "neutral", children }: { kicker: string; title: string; tone?: "ok" | "bad" | "neutral"; children: React.ReactNode }) {
  const color = tone === "ok" ? "text-ok-strong font-medium" : tone === "bad" ? "text-danger font-medium" : "text-muted";
  return (
    <section aria-labelledby="result-title" className="mx-auto flex max-w-2xl flex-col gap-6 py-6">
      <p className={`text-sm ${color}`}>{kicker}</p>
      <h1 id="result-title" tabIndex={-1} className="text-4xl font-medium leading-[1.1] tracking-[-0.03em]">
        {title}
      </h1>
      {children}
    </section>
  );
}

function Success({ payment }: { payment: Payment }) {
  const r = payment.result!;
  const accountLabel = r.accountId.replace(/^acc_/, "").toUpperCase();
  if (payment.kind === "renewal")
    return (
      <Shell kicker="Оплата прошла" tone="ok" title={`Подписка продлена до ${formatDate(r.paidUntil)}`}>
        <p className="leading-relaxed text-ink/80">Аккаунт {accountLabel} остаётся за вами — доступы и настройки не меняются.</p>
        <Receipt
          animate
          title={`Чек · ${PROVIDERS[payment.provider].name}`}
          rows={[
            ["Продление", `тариф «${payment.planName}», 30 дней`],
            ["Аккаунт", <span key="a" className="font-mono">{accountLabel}</span>],
            ["Оплачено до", formatDate(r.paidUntil)],
            ["Дата оплаты", formatDateTime(payment.completedAt!)],
          ]}
          total={["Оплачено", formatRub(payment.amountRub)]}
        />
        <ButtonLink href="/account" size="lg" className="self-start">Вернуться в кабинет</ButtonLink>
      </Shell>
    );

  return (
    <Shell kicker="Оплата прошла" tone="ok" title={`Аккаунт ${accountLabel} закреплён за вами`}>
      <p className="leading-relaxed text-ink/80">
        Оплаченный месяц начался {formatDateTime(payment.completedAt!)} и продлится до {formatDate(r.paidUntil)}. Аккаунт
        только ваш на весь этот срок. Доступы и инструкции для UnoWork и BB уже ждут в кабинете.
      </p>
      <Receipt
        animate
        title={`Чек · ${PROVIDERS[payment.provider].name}`}
        rows={[
          ["Тариф", payment.planName],
          ["Аккаунт", <span key="a" className="font-mono">{accountLabel}</span>],
          ["Почта кабинета", payment.email],
          ["Оплачено до", formatDate(r.paidUntil)],
        ]}
        total={["Оплачено", formatRub(payment.amountRub)]}
      />
      {r.signedIn && r.needsPassword ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-6">
          <p className="font-semibold">Последний шаг — пароль для входа</p>
          <p className="text-[15px] leading-relaxed text-ink/80">
            Кабинет создан на почту <strong>{payment.email}</strong>. Придумайте пароль, чтобы потом входить с любого устройства.
          </p>
          <ButtonLink href="/account/setup" size="lg" className="self-start">Создать пароль</ButtonLink>
        </div>
      ) : r.signedIn ? (
        <ButtonLink href="/account" size="lg" className="self-start">Открыть кабинет</ButtonLink>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="leading-relaxed text-ink/80">
            На почту {payment.email} уже есть кабинет. Войдите в него, чтобы увидеть доступы.
          </p>
          <ButtonLink href={`/login?email=${encodeURIComponent(payment.email)}&next=/account`} size="lg" className="self-start">
            Войти в кабинет
          </ButtonLink>
        </div>
      )}
    </Shell>
  );
}

function Unsuccessful({ payment }: { payment: Payment }) {
  const router = useRouter();
  const retry = useAction(() =>
    payment.kind === "purchase"
      ? api().startPurchase({ planId: payment.planId, email: payment.email, provider: payment.provider, acceptedTerms: true })
      : api().startRenewal(payment.provider),
  );
  const backHref =
    payment.kind === "purchase"
      ? `/buy/${payment.planId}?email=${encodeURIComponent(payment.email)}&provider=${payment.provider}`
      : "/account/renew";
  const cancelled = payment.status === "cancelled";
  const reason = payment.failureReason;

  const texts = cancelled
    ? { kicker: "Оплата отменена", title: "Вы отменили оплату", body: "Деньги не списаны, аккаунт не назначен. Можно вернуться и оформить заново — данные заказа сохранены." }
    : reason === "out_of_stock"
      ? { kicker: "Оплата не прошла", title: "Свободный аккаунт успели купить", body: "Пока вы оплачивали, последний аккаунт этого тарифа достался другому покупателю. Деньги не списаны. Оставьте заявку — администратор свяжется с вами." }
      : reason === "already_subscribed"
        ? { kicker: "Оплата не прошла", title: "На эту почту уже оформлен доступ", body: "Деньги не списаны. Войдите в кабинет — там можно продлить текущую подписку." }
        : reason === "renewal_unavailable"
          ? { kicker: "Оплата не прошла", title: "Продление сейчас недоступно", body: "Деньги не списаны. Пока аккаунт заблокирован или обращение рассматривается, продлить подписку нельзя." }
          : { kicker: "Оплата не прошла", title: "Банк отклонил платёж", body: payment.kind === "purchase" ? "Деньги не списаны, аккаунт не назначен. Попробуйте ещё раз или выберите другой способ оплаты." : "Деньги не списаны, срок подписки не изменился. Попробуйте ещё раз или выберите другой способ оплаты." };

  async function onRetry() {
    const next = await retry.mutateAsync(undefined);
    router.push(next.redirectUrl);
  }

  return (
    <Shell kicker={texts.kicker} tone={cancelled ? "neutral" : "bad"} title={texts.title}>
      <p className="leading-relaxed text-ink/80">{texts.body}</p>
      <Receipt
        title="Заказ"
        rows={[
          [payment.kind === "purchase" ? "Тариф" : "Продление", payment.planName],
          ["Способ оплаты", PROVIDERS[payment.provider].name],
          ["Статус", cancelled ? "отменён" : "не оплачен"],
        ]}
        total={["Сумма", formatRub(payment.amountRub)]}
      />
      {retry.isError && (
        <Notice tone="danger" role="alert">{errorMessage(retry.error)}</Notice>
      )}
      <div className="flex flex-wrap gap-3">
        {reason === "out_of_stock" ? (
          <ButtonLink href={`/waitlist/${payment.planId}`} size="lg">Оставить заявку в очередь</ButtonLink>
        ) : reason === "already_subscribed" ? (
          <ButtonLink href={`/login?email=${encodeURIComponent(payment.email)}&next=/account`} size="lg">Войти в кабинет</ButtonLink>
        ) : reason === "renewal_unavailable" ? (
          <ButtonLink href="/account" size="lg">В кабинет</ButtonLink>
        ) : (
          <>
            <ButtonLink href={backHref} size="lg">{cancelled ? (payment.kind === "purchase" ? "Вернуться к покупке" : "Вернуться к продлению") : "Выбрать другой способ"}</ButtonLink>
            {!cancelled && (
              <Button size="lg" variant="secondary" onClick={onRetry} loading={retry.isPending} loadingText="Готовим оплату…">
                Попробовать ещё раз
              </Button>
            )}
          </>
        )}
      </div>
    </Shell>
  );
}
