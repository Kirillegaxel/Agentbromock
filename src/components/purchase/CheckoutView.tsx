"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ASSUMPTIONS } from "@/domain/assumptions";
import { DomainError, errorMessage } from "@/domain/errors";
import { formatRub } from "@/domain/format";
import type { PaymentProvider } from "@/domain/types";
import { hasErrors, validateEmail, type FieldErrors } from "@/domain/validation";
import { api, useAction, useMyAccess, usePlan, useSession } from "@/lib/queries";
import { StockMeter } from "../StockMeter";
import { Button, ButtonLink } from "../ui/Button";
import { Checkbox, focusFirstInvalid, TextField } from "../ui/Field";
import { Notice } from "../ui/Notice";
import { PageLoading } from "../ui/Skeleton";
import { ProviderPicker } from "./ProviderPicker";
import { Receipt } from "./Receipt";

type Fields = "email" | "provider" | "acceptedTerms";

export function CheckoutView({ planId }: { planId: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const { data: plan, isPending } = usePlan(planId);
  const { data: session } = useSession();
  const { data: access } = useMyAccess(session?.role === "client");

  const [email, setEmail] = useState(search.get("email") ?? "");
  const [provider, setProvider] = useState<PaymentProvider | null>(
    (search.get("provider") as PaymentProvider | null) ?? null,
  );
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const start = useAction((input: Parameters<ReturnType<typeof api>["startPurchase"]>[0]) => api().startPurchase(input));
  const sessionEmail = session?.user?.email;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- подставляем почту вошедшего пользователя
    if (sessionEmail) setEmail(sessionEmail);
  }, [sessionEmail]);

  if (isPending) return <PageLoading />;
  if (!plan)
    return (
      <Notice tone="warning" title="Такого тарифа нет">
        <Link href="/#plans" className="underline">Вернуться к тарифам</Link>
      </Notice>
    );

  if (access)
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <h1 className="text-3xl font-medium leading-[1.1] tracking-[-0.03em]">У вас уже есть доступ</h1>
        <p className="leading-relaxed text-ink/80">
          В прототипе на одного клиента оформляется одна подписка. Ваш тариф — «{access.plan.name}», продлить его можно в кабинете.
        </p>
        <ButtonLink href="/account" className="self-start">Открыть кабинет</ButtonLink>
      </div>
    );

  const soldOut = plan.available === 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: FieldErrors<Fields> = {
      email: validateEmail(email),
      provider: provider ? undefined : "Выберите способ оплаты.",
      acceptedTerms: accepted ? undefined : "Подтвердите, что знакомы с условиями использования.",
    };
    setErrors(next);
    if (hasErrors(next) || !provider) return focusFirstInvalid(formRef.current);
    try {
      const payment = await start.mutateAsync({ planId, email, provider, acceptedTerms: accepted });
      router.push(payment.redirectUrl);
    } catch (err) {
      if (err instanceof DomainError && err.fields) {
        setErrors(err.fields as FieldErrors<Fields>);
        focusFirstInvalid(formRef.current);
      }
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="text-sm text-muted">Шаг 1 из 2 · Оформление</p>
          <h1 className="text-4xl font-medium leading-[1.1] tracking-[-0.03em]">Тариф «{plan.name}» на месяц</h1>
          <p className="max-w-xl font-serif text-lg leading-relaxed text-ink/75">{plan.description}</p>
        </header>

        {soldOut ? (
          <Notice tone="warning" title="Свободные аккаунты этого тарифа закончились" role="status">
            <p>Пока вы смотрели страницу, последний аккаунт купили. Оставьте заявку — администратор свяжется с вами, когда аккаунт появится.</p>
            <ButtonLink href={`/waitlist/${plan.id}`} variant="secondary" size="sm" className="mt-3">
              Оставить заявку в очередь
            </ButtonLink>
          </Notice>
        ) : (
          <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-7">
            <TextField
              label="Почта"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="name@example.com"
              value={email}
              readOnly={Boolean(sessionEmail)}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
              }}
              error={errors.email}
              hint={
                sessionEmail
                  ? "Покупка оформляется на почту вашего кабинета."
                  : "На эту почту создадим личный кабинет. Пароль для входа вы придумаете сразу после оплаты."
              }
            />
            <ProviderPicker
              value={provider}
              onChange={(p) => {
                setProvider(p);
                setErrors((x) => ({ ...x, provider: undefined }));
              }}
              error={errors.provider}
            />
            <div className="rounded-xl bg-sand/70 p-4">
              <Checkbox
                checked={accepted}
                onChange={(e) => {
                  setAccepted(e.target.checked);
                  setErrors((x) => ({ ...x, acceptedTerms: undefined }));
                }}
                error={errors.acceptedTerms}
                label={
                  <>
                    Я понимаю, что аккаунт работает только на сервере Hermes через UnoWork или BB и его нельзя использовать
                    для запуска Hermes на своём компьютере. С{" "}
                    <Link href="/rules" target="_blank" className="font-medium underline underline-offset-2">
                      правилами использования
                    </Link>{" "}
                    ознакомлен(а).
                  </>
                }
              />
            </div>
            {start.isError && !(start.error instanceof DomainError && start.error.fields) && (
              <Notice tone="danger" role="alert" title="Не получилось перейти к оплате">
                {errorMessage(start.error)}
                {start.error instanceof DomainError && start.error.code === "already_subscribed" && (
                  <Link href={`/login?email=${encodeURIComponent(email)}&next=/account`} className="mt-2 block font-medium underline">
                    Войти в кабинет
                  </Link>
                )}
              </Notice>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button type="submit" size="lg" loading={start.isPending} loadingText="Готовим оплату…">
                Перейти к оплате · {formatRub(plan.priceRub)}
              </Button>
              <p className="text-[13px] text-muted">Деньги спишутся только на странице платёжной системы.</p>
            </div>
          </form>
        )}
      </div>

      <aside aria-label="Состав покупки" className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <Receipt
          title="Состав покупки"
          rows={[
            ["Тариф", plan.name],
            ["Срок", `${ASSUMPTIONS.periodDays} дней с момента оплаты`],
            ["Аккаунт", "личный, один"],
            ["Доступ", "UnoWork и BB"],
            ["Продление", "вручную, в кабинете"],
          ]}
          total={["К оплате", formatRub(plan.priceRub)]}
          footer="Свободный аккаунт закрепится за вами сразу после успешной оплаты. Если оплата не пройдёт, аккаунт не назначается и деньги не списываются."
        />
        <div className="rounded-2xl border border-line p-5">
          <StockMeter available={plan.available} />
        </div>
      </aside>
    </div>
  );
}
