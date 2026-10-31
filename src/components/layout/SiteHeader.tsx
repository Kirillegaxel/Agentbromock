"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/queries";
import { cn } from "@/lib/cn";
import { buttonClass } from "../ui/Button";
import { Logo } from "./Logo";

const NAV = [
  { href: "/#access", label: "Доступ" },
  { href: "/#plans", label: "Тарифы" },
  { href: "/#faq", label: "Вопросы" },
  { href: "/rules", label: "Правила" },
];

export function SiteHeader() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- закрываем меню при переходе
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const account =
    session?.role === "admin"
      ? { href: "/admin", label: "Админка" }
      : session?.role === "client"
        ? { href: "/account", label: "Кабинет" }
        : { href: "/login", label: "Войти" };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,box-shadow] duration-300",
        scrolled || open ? "bg-paper/95 shadow-[0_1px_0_var(--color-line)] backdrop-blur" : "bg-paper",
      )}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-paper">
        Перейти к содержимому
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <Logo />
        <nav aria-label="Основная навигация" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-[15px] text-ink/70 transition-colors hover:text-ink">
              {item.label}
            </Link>
          ))}
          <Link href={account.href} className="ml-2 rounded-lg px-3 py-2 text-[15px] font-medium hover:bg-ink/5">
            {account.label}
          </Link>
          <Link href="/#plans" className={buttonClass("primary", "sm", "ml-1 h-9 px-4")}>
            Выбрать тариф
          </Link>
        </nav>
        <button
          type="button"
          className="-mr-2 grid size-11 place-items-center rounded-lg md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setOpen((o) => !o)}
        >
          <span aria-hidden className="relative block h-3 w-5">
            <span className={cn("absolute left-0 h-[1.5px] w-5 bg-ink transition-transform duration-200", open ? "top-1.5 rotate-45" : "top-0.5")} />
            <span className={cn("absolute left-0 h-[1.5px] w-5 bg-ink transition-transform duration-200", open ? "top-1.5 -rotate-45" : "top-2.5")} />
          </span>
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Основная навигация" className="animate-fade px-5 pt-1 pb-6 md:hidden">
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setOpen(false)} className="block border-b border-line py-3.5 text-lg">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={account.href} className="block border-b border-line py-3.5 text-lg font-medium">
                {account.label}
              </Link>
            </li>
          </ul>
          <Link href="/#plans" onClick={() => setOpen(false)} className={buttonClass("primary", "md", "mt-5 w-full")}>
            Выбрать тариф
          </Link>
        </nav>
      )}
    </header>
  );
}
