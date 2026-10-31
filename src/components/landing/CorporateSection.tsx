"use client";

import { useRef, useState, type FormEvent } from "react";
import type { CorporateInput } from "@/data/api";
import { DomainError, errorMessage } from "@/domain/errors";
import type { ContactChannel } from "@/domain/types";
import { hasErrors, validateContact, validateName, type FieldErrors } from "@/domain/validation";
import { api, useAction, useLandingSettings } from "@/lib/queries";
import { ContactFields } from "../forms/ContactFields";
import { PixelArt } from "../pixel/PixelArt";
import { LIGHT, ON_BRAND, TEAM } from "../pixel/sprites";
import { Button } from "../ui/Button";
import { focusFirstInvalid, SelectField, TextArea, TextField } from "../ui/Field";
import { Notice } from "../ui/Notice";

type Fields = keyof CorporateInput;

const EMPTY: CorporateInput = { company: "", name: "", contactChannel: "email", contact: "", teamSize: "", message: "" };

export function CorporateSection() {
  const { data: settings } = useLandingSettings();
  if (!settings?.corporateBlockEnabled) return null;
  return <CorporateBlock />;
}

function CorporateBlock() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const show = () => {
    dialogRef.current?.showModal();
    setOpen(true);
  };
  const close = () => dialogRef.current?.close();

  return (
    <section id="teams" aria-labelledby="teams-title" className="animate-fade py-20">
      <div className="flex flex-col gap-10 rounded-3xl bg-brand-strong px-6 py-12 text-[#fbf6f0] sm:px-12 sm:py-16 lg:flex-row lg:items-center lg:justify-between [&_:focus-visible]:outline-[#fbf6f0]">
        <div className="flex max-w-2xl flex-col gap-5">
          <h2 id="teams-title" className="text-[34px] leading-[1.1] font-medium tracking-[-0.025em] sm:text-[44px]">
            Аккаунты для команды
          </h2>
          <p className="font-serif text-[19px] leading-relaxed text-[#f6e3d8]">
            Оставьте заявку — администратор свяжется с вами, чтобы обсудить количество аккаунтов и порядок работы.
            Каждый аккаунт личный, на одного человека; отдельных корпоративных тарифов и оплаты по счёту пока нет.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-5">
            <button
              ref={triggerRef}
              type="button"
              onClick={show}
              aria-haspopup="dialog"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-[#fbf6f0] px-6 font-medium text-ink transition-colors hover:bg-white active:translate-y-px"
            >
              Оставить заявку
            </button>
            <p className="text-sm text-[#f6e3d8]">Ни к чему не обязывает и не требует оплаты.</p>
          </div>
        </div>
        <PixelArt art={TEAM} palette={ON_BRAND} className="h-16 w-auto shrink-0 self-start sm:h-24 lg:self-center" />
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="teams-dialog-title"
        onClose={() => {
          setOpen(false);
          triggerRef.current?.focus();
        }}
        onClick={(e) => {
          // клик по затемнению закрывает окно
          if (e.target === e.currentTarget) close();
        }}
        className="m-auto max-h-[calc(100dvh-1.5rem)] w-[min(100vw-1.5rem,620px)] max-w-none overflow-y-auto overscroll-contain rounded-3xl bg-paper p-0 text-ink shadow-[0_40px_80px_-30px_rgb(28_27_23/0.5)]"
      >
        {open && <CorporateForm onClose={close} />}
      </dialog>
    </section>
  );
}

function CorporateForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CorporateInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});
  const [sent, setSent] = useState<{ name: string; contact: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submit = useAction((input: CorporateInput) => api().submitCorporate(input));

  const set = <K extends Fields>(key: K, value: CorporateInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: FieldErrors<Fields> = {
      company: form.company.trim() ? undefined : "Укажите название компании или команды.",
      name: validateName(form.name),
      contact: validateContact(form.contactChannel, form.contact),
      teamSize: form.teamSize ? undefined : "Выберите размер команды.",
      message: form.message.trim() ? undefined : "Расскажите в двух словах, что нужно команде.",
    };
    setErrors(next);
    if (hasErrors(next)) return focusFirstInvalid(formRef.current);
    try {
      await submit.mutateAsync(form);
      setSent({ name: form.name.trim(), contact: form.contact.trim() });
    } catch (err) {
      if (err instanceof DomainError && err.fields) {
        setErrors(err.fields as FieldErrors<Fields>);
        focusFirstInvalid(formRef.current);
      }
    }
  }

  return (
    <div className="animate-rise">
      <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-9 sm:pt-8">
        <PixelArt art={TEAM} palette={LIGHT} className="h-9 w-auto" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="-mt-1 -mr-2 grid size-10 place-items-center rounded-lg text-muted transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <svg aria-hidden viewBox="0 0 16 16" className="size-4">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {sent ? (
        <div role="status" className="flex flex-col items-start gap-4 px-6 pt-6 pb-8 sm:px-9 sm:pb-10">
          <h2 id="teams-dialog-title" className="text-3xl leading-[1.1] font-medium tracking-[-0.025em]">
            Спасибо, {sent.name}!
          </h2>
          <p className="font-serif text-lg leading-relaxed text-ink/75">
            Заявка у нас. Администратор свяжется с вами по контакту <span className="font-medium text-ink">{sent.contact}</span>.
            Автоматических рассылок не будет — напишет человек.
          </p>
          <Button onClick={onClose} className="mt-2">Закрыть</Button>
        </div>
      ) : (
        <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5 px-6 pt-5 pb-8 sm:px-9 sm:pb-10">
          <div className="flex flex-col gap-2">
            <h2 id="teams-dialog-title" className="text-3xl leading-[1.1] font-medium tracking-[-0.025em]">
              Заявка для команды
            </h2>
            <p className="font-serif text-[17px] leading-relaxed text-ink/70">
              Расскажите о команде — администратор свяжется с вами и обсудит детали.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Компания или команда"
              autoComplete="organization"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              error={errors.company}
            />
            <TextField
              label="Как к вам обращаться"
              autoComplete="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              error={errors.name}
            />
          </div>
          <ContactFields
            channel={form.contactChannel}
            value={form.contact}
            onChannel={(c: ContactChannel) => set("contactChannel", c)}
            onValue={(v) => set("contact", v)}
            error={errors.contact}
          />
          <SelectField
            label="Сколько человек в команде"
            value={form.teamSize}
            onChange={(e) => set("teamSize", e.target.value)}
            error={errors.teamSize}
          >
            <option value="">Выберите</option>
            <option value="2–5">2–5</option>
            <option value="6–15">6–15</option>
            <option value="16–50">16–50</option>
            <option value="больше 50">больше 50</option>
          </SelectField>
          <TextArea
            label="Что нужно команде"
            placeholder="Например: шесть разработчиков, хотим начать с одного проекта в следующем месяце"
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            error={errors.message}
          />
          {submit.isError && !(submit.error instanceof DomainError && submit.error.fields) && (
            <Notice tone="danger" role="alert">{errorMessage(submit.error)}</Notice>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-4">
            <Button type="submit" size="lg" variant="brand" loading={submit.isPending} loadingText="Отправляем…">
              Отправить
            </Button>
            <p className="text-sm text-muted">Ни к чему не обязывает и не требует оплаты.</p>
          </div>
        </form>
      )}
    </div>
  );
}
