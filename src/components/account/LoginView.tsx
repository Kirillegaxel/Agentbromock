"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { DomainError, errorMessage } from "@/domain/errors";
import { validateEmail } from "@/domain/validation";
import { api, useAction } from "@/lib/queries";
import { Button } from "../ui/Button";
import { focusFirstInvalid, TextField } from "../ui/Field";
import { Notice } from "../ui/Notice";

export function LoginView() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState(search.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const formRef = useRef<HTMLFormElement>(null);
  const login = useAction((v: { email: string; password: string }) => api().login(v.email, v.password));
  const next = search.get("next");
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/account";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = { email: validateEmail(email), password: password ? undefined : "Введите пароль." };
    setErrors(errs);
    if (errs.email || errs.password) return focusFirstInvalid(formRef.current);
    try {
      await login.mutateAsync({ email, password });
      router.push(safeNext);
    } catch (err) {
      if (err instanceof DomainError && err.fields) setErrors(err.fields);
    }
  }

  return (
    <section aria-labelledby="login-title" className="mx-auto flex max-w-md flex-col gap-6 py-8">
      <div className="flex flex-col gap-2">
        <h1 id="login-title" className="text-4xl font-medium leading-[1.1] tracking-[-0.03em]">Вход в кабинет</h1>
        <p className="text-ink/75">Почта, на которую оформлена покупка, и пароль, созданный после первой оплаты.</p>
      </div>
      <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <TextField label="Почта" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <TextField label="Пароль" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        {login.isError && !(login.error instanceof DomainError && login.error.fields) && (
          <Notice tone="danger" role="alert">{errorMessage(login.error)}</Notice>
        )}
        <Button type="submit" size="lg" loading={login.isPending} loadingText="Входим…">Войти</Button>
      </form>
      <p className="border-t border-line pt-5 text-[15px] text-ink/75">
        Ещё нет кабинета? Он создаётся при покупке.{" "}
        <Link href="/#plans" className="font-medium text-ok underline underline-offset-2">Выбрать тариф</Link>
      </p>
    </section>
  );
}
