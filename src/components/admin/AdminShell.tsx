"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { errorMessage } from "@/domain/errors";
import { api, useAction, useSession } from "@/lib/queries";
import { cn } from "@/lib/cn";
import { Logo } from "../layout/Logo";
import { Button } from "../ui/Button";
import { TextField } from "../ui/Field";
import { Notice } from "../ui/Notice";
import { PageLoading } from "../ui/Skeleton";

const NAV = [
  { href: "/admin", label: "Сводка" },
  { href: "/admin/plans", label: "Тарифы и цены" },
  { href: "/admin/inventory", label: "Наличие" },
  { href: "/admin/requests", label: "Заявки" },
  { href: "/admin/landing", label: "Корпоративный блок" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAction(() => api().logout());

  return (
    <div className="min-h-dvh bg-[#efede6]">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-5">
          <Logo href="/admin" suffix="/ админка" />
          <div className="flex items-center gap-2">
            <Link href="/" className="rounded px-2 py-1 text-sm text-muted hover:text-ink">Открыть лендинг ↗</Link>
            {session?.role === "admin" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await logout.mutateAsync(undefined);
                  router.push("/admin");
                }}
              >
                Выйти
              </Button>
            )}
          </div>
        </div>
      </header>
      {isPending ? (
        <div className="mx-auto max-w-3xl px-5"><PageLoading /></div>
      ) : session?.role !== "admin" ? (
        <AdminLogin />
      ) : (
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 md:grid-cols-[210px_1fr] md:gap-10 md:py-10">
          <nav aria-label="Разделы админки" className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
            <ul className="flex gap-1 md:sticky md:top-6 md:flex-col">
              {NAV.map((n) => {
                const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block rounded-md px-3 py-2 text-[15px] whitespace-nowrap transition-colors",
                        active ? "bg-ink text-paper" : "hover:bg-ink/5",
                      )}
                    >
                      {n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <main id="main" className="min-w-0 pb-20">{children}</main>
        </div>
      )}
    </div>
  );
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useAction((v: { email: string; password: string }) => api().adminLogin(v.email, v.password));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    login.mutate({ email, password });
  }

  return (
    <main id="main" className="mx-auto flex max-w-sm flex-col gap-6 px-5 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Вход для администратора</h1>
        <p className="mt-1 text-[15px] text-muted">Тарифы, наличие аккаунтов, заявки и настройки лендинга.</p>
      </div>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField label="Почта" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Пароль" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {login.isError && <Notice tone="danger" role="alert">{errorMessage(login.error)}</Notice>}
        <Button type="submit" loading={login.isPending}>Войти</Button>
      </form>
    </main>
  );
}

export function AdminPageHead({ title, lead, actions }: { title: string; lead?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="flex max-w-2xl flex-col gap-1.5">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {lead && <p className="leading-relaxed text-muted">{lead}</p>}
      </div>
      {actions}
    </header>
  );
}
