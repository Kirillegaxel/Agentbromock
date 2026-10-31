"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, formatDateTime, formatRub } from "@/domain/format";
import { api, useAction, useMyAccess, useSession } from "@/lib/queries";
import { ButtonLink, Button } from "../ui/Button";
import { Notice } from "../ui/Notice";
import { PageLoading } from "../ui/Skeleton";
import { AccessTabs } from "./AccessTabs";
import { IncidentPanel } from "./IncidentPanel";
import { SubscriptionCard } from "./SubscriptionCard";

export function AccountView() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const isClient = session?.role === "client";
  const { data: access, isPending: accessPending } = useMyAccess(isClient);
  const logout = useAction(() => api().logout());

  if (isPending || (isClient && accessPending)) return <PageLoading label="Загружаем кабинет…" />;

  if (!isClient || !session.user)
    return (
      <section className="mx-auto flex max-w-md flex-col gap-4 py-10">
        <h1 className="text-4xl font-medium leading-[1.1] tracking-[-0.03em]">Личный кабинет</h1>
        <p className="leading-relaxed text-ink/75">
          {session?.role === "admin"
            ? "Вы вошли как администратор. Кабинет покупателя открывается под учётной записью клиента."
            : "Войдите, чтобы увидеть свой аккаунт, срок подписки и инструкции по подключению."}
        </p>
        <div className="flex gap-3">
          <ButtonLink href="/login?next=/account">Войти</ButtonLink>
          <ButtonLink href="/#plans" variant="secondary">Выбрать тариф</ButtonLink>
        </div>
      </section>
    );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="text-sm text-muted">Личный кабинет</p>
          <h1 className="mt-2 text-4xl font-medium leading-[1.1] tracking-[-0.03em]">
            {session.user.name ? `Здравствуйте, ${session.user.name}` : "Ваш доступ"}
          </h1>
          <p className="mt-1 text-muted">{session.user.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          loading={logout.isPending}
          onClick={async () => {
            await logout.mutateAsync(undefined);
            router.push("/");
          }}
        >
          Выйти
        </Button>
      </header>

      {session.needsPassword && (
        <Notice tone="warning" title="Создайте пароль для входа">
          Сейчас вы в кабинете благодаря покупке. Без пароля после выхода войти снова не получится.{" "}
          <Link href="/account/setup" className="font-medium underline">Создать пароль</Link>
        </Notice>
      )}

      {!access ? (
        <section className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-line-strong p-8">
          <h2 className="text-2xl font-semibold">Доступа пока нет</h2>
          <p className="max-w-xl leading-relaxed text-ink/75">
            Выберите тариф — после оплаты аккаунт сразу закрепится за вами, а здесь появятся доступы и инструкции для
            UnoWork и BB.
          </p>
          <ButtonLink href="/#plans">Выбрать тариф</ButtonLink>
        </section>
      ) : (
        <>
          <IncidentPanel access={access} />
          <SubscriptionCard access={access} />
          <AccessTabs access={access} />
          <section aria-labelledby="history-title" className="flex flex-col gap-4">
            <h2 id="history-title" className="text-xl font-semibold">История оплат</h2>
            <div className="overflow-x-auto rounded-lg border border-line bg-card">
              <table className="w-full min-w-[520px] text-left text-[15px]">
                <thead className="border-b border-line text-sm text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Оплата</th>
                    <th scope="col" className="px-4 py-3 font-medium">Период</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {[...access.subscription.periods].reverse().map((p) => (
                    <tr key={p.paymentId} className="border-b border-line/70 last:border-0">
                      <td className="px-4 py-3">{formatDateTime(p.paidAt)}</td>
                      <td className="px-4 py-3">{formatDate(p.from)} — {formatDate(p.to)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatRub(p.amountRub)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <p className="text-sm leading-relaxed text-muted">
            Аккаунт работает только в серверной среде Hermes. Не переносите доступы на свой компьютер и не передавайте их
            другим людям — это нарушение{" "}
            <Link href="/rules" className="underline underline-offset-2 hover:text-ink">правил использования</Link>.
          </p>
        </>
      )}
    </div>
  );
}
