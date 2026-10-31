"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import type { WaitlistInput } from "@/data/api";
import { DomainError, errorMessage } from "@/domain/errors";
import { formatRub } from "@/domain/format";
import type { ContactChannel, WaitlistRequest } from "@/domain/types";
import { hasErrors, validateContact, validateName, type FieldErrors } from "@/domain/validation";
import { api, useAction, usePlan, useSession } from "@/lib/queries";
import { ContactFields } from "../forms/ContactFields";
import { Button, ButtonLink } from "../ui/Button";
import { focusFirstInvalid, TextArea, TextField } from "../ui/Field";
import { Notice } from "../ui/Notice";
import { PageLoading } from "../ui/Skeleton";

type Fields = "name" | "contact" | "comment";

export function WaitlistView({ planId }: { planId: string }) {
  const { data: plan, isPending } = usePlan(planId);
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<ContactChannel>("email");
  const [contact, setContact] = useState("");
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});
  const [sent, setSent] = useState<WaitlistRequest | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submit = useAction((input: WaitlistInput) => api().submitWaitlist(input));

  if (isPending) return <PageLoading />;
  if (!plan)
    return (
      <Notice tone="warning" title="Такого тарифа нет">
        <Link href="/#plans" className="underline">Вернуться к тарифам</Link>
      </Notice>
    );

  if (sent)
    return (
      <section role="status" className="mx-auto flex max-w-2xl animate-rise flex-col gap-5 py-6">
        <p className="text-sm font-medium text-ok-strong">Заявка принята</p>
        <h1 className="text-4xl font-medium leading-[1.1] tracking-[-0.03em]">Вы в очереди на тариф «{sent.planName}»</h1>
        <p className="leading-relaxed text-ink/80">
          Когда аккаунт появится, администратор свяжется с вами сам — по контакту <strong className="font-mono">{sent.contact}</strong>.
          Заявка не бронирует аккаунт и ничего не списывает: решение о покупке вы примете, когда вам напишут.
        </p>
        <ButtonLink href="/" variant="secondary" className="self-start">На главную</ButtonLink>
      </section>
    );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: FieldErrors<Fields> = {
      name: validateName(name),
      contact: validateContact(channel, contact),
      comment: comment.length > 1000 ? "Комментарий длиннее 1000 символов." : undefined,
    };
    setErrors(next);
    if (hasErrors(next)) return focusFirstInvalid(formRef.current);
    try {
      const request = await submit.mutateAsync({ planId, name, contactChannel: channel, contact, comment });
      setSent(request as WaitlistRequest);
    } catch (err) {
      if (err instanceof DomainError && err.fields) {
        setErrors(err.fields as FieldErrors<Fields>);
        focusFirstInvalid(formRef.current);
      }
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-14">
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="text-sm text-muted">Очередь на тариф</p>
          <h1 className="text-4xl font-medium leading-[1.1] tracking-[-0.03em]">Заявка на тариф «{plan.name}»</h1>
          <p className="max-w-xl font-serif text-lg leading-relaxed text-ink/75">
            Свободных аккаунтов этого тарифа сейчас нет. Оставьте контакт — администратор свяжется с вами, когда аккаунт
            появится. Это не покупка: оплата не нужна, аккаунт автоматически не назначается.
          </p>
        </header>

        {plan.available > 0 && (
          <Notice tone="success" title="Аккаунты этого тарифа снова в наличии">
            Можно не ждать: <Link href={`/buy/${plan.id}`} className="font-medium underline">купить сразу</Link>. Заявку тоже можно оставить.
          </Notice>
        )}

        <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          <TextField
            label="Как к вам обращаться"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((x) => ({ ...x, name: undefined }));
            }}
            error={errors.name}
          />
          <ContactFields
            channel={channel}
            value={contact}
            onChannel={(c) => {
              setChannel(c);
              setErrors((x) => ({ ...x, contact: undefined }));
              if (c === "email" && session?.user && !contact) setContact(session.user.email);
            }}
            onValue={(v) => {
              setContact(v);
              setErrors((x) => ({ ...x, contact: undefined }));
            }}
            error={errors.contact}
          />
          <TextArea
            label="Комментарий"
            optional
            placeholder="Например: удобно писать после 18:00, нужен доступ к началу следующего месяца"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            error={errors.comment}
          />
          {submit.isError && !(submit.error instanceof DomainError && submit.error.fields) && (
            <Notice tone="danger" role="alert">{errorMessage(submit.error)}</Notice>
          )}
          <Button type="submit" size="lg" className="self-start" loading={submit.isPending} loadingText="Отправляем…">
            Оставить заявку
          </Button>
        </form>
      </div>
      <aside className="flex flex-col gap-3 self-start rounded-2xl bg-sand/70 p-6 text-[15px]">
        <p className="font-semibold">Тариф «{plan.name}»</p>
        <p className="text-2xl font-medium">{formatRub(plan.priceRub)} <span className="text-base font-normal text-muted">в месяц</span></p>
        <p className="text-muted">{plan.tagline}</p>
        <hr className="border-line" />
        <p className="text-[13px] leading-relaxed text-muted">
          Цена указана на сегодня. Когда администратор свяжется с вами, условия могут отличаться.
        </p>
      </aside>
    </div>
  );
}
