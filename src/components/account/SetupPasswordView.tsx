"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { errorMessage } from "@/domain/errors";
import { validatePassword } from "@/domain/validation";
import { api, useAction, useSession } from "@/lib/queries";
import { Button, ButtonLink } from "../ui/Button";
import { focusFirstInvalid, TextField } from "../ui/Field";
import { Notice } from "../ui/Notice";
import { PageLoading } from "../ui/Skeleton";

export function SetupPasswordView() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [errors, setErrors] = useState<{ password?: string; repeat?: string }>({});
  const formRef = useRef<HTMLFormElement>(null);
  const save = useAction((p: string) => api().setPassword(p));

  if (isPending) return <PageLoading />;
  if (session?.role !== "client" || !session.user)
    return (
      <Notice tone="warning" title="Сначала войдите в кабинет" className="mx-auto max-w-md">
        <Link href="/login?next=/account" className="underline">Перейти ко входу</Link>
      </Notice>
    );
  if (!session.needsPassword && !save.isSuccess)
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 py-8">
        <h1 className="text-3xl font-medium leading-[1.1] tracking-[-0.03em]">Пароль уже создан</h1>
        <ButtonLink href="/account" className="self-start">Открыть кабинет</ButtonLink>
      </div>
    );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = {
      password: validatePassword(password),
      repeat: password === repeat ? undefined : "Пароли не совпадают.",
    };
    setErrors(errs);
    if (errs.password || errs.repeat) return focusFirstInvalid(formRef.current);
    try {
      await save.mutateAsync(password);
      router.push("/account");
    } catch {
      // сообщение об ошибке показывается под формой
    }
  }

  return (
    <section aria-labelledby="setup-title" className="mx-auto flex max-w-md flex-col gap-6 py-8">
      <p className="text-sm text-muted">Шаг 2 из 2 · Вход в кабинет</p>
      <div className="flex flex-col gap-2">
        <h1 id="setup-title" className="text-4xl font-medium leading-[1.1] tracking-[-0.03em]">Придумайте пароль</h1>
        <p className="leading-relaxed text-ink/75">
          Входить в кабинет вы будете по почте <strong>{session.user.email}</strong> и этому паролю — с любого устройства.
        </p>
      </div>
      <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <TextField
          label="Пароль"
          type="password"
          autoComplete="new-password"
          hint="Не короче 8 символов, буквы и цифры."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <TextField label="Повторите пароль" type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} error={errors.repeat} />
        {save.isError && <Notice tone="danger" role="alert">{errorMessage(save.error)}</Notice>}
        <Button type="submit" size="lg" loading={save.isPending} loadingText="Сохраняем…">Сохранить и открыть кабинет</Button>
      </form>
      <Link href="/account" className="self-start text-sm text-muted underline underline-offset-2 hover:text-ink">
        Сделать это позже
      </Link>
    </section>
  );
}
