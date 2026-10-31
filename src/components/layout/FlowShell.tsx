import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";

/** Обёртка для шагов покупки, входа и кабинета. */
export function FlowShell({ children, back }: { children: ReactNode; back?: { href: string; label: string } }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-5xl px-5 pt-6 pb-24 sm:px-8">
        {back && (
          <Link href={back.href} className="mb-6 inline-flex items-center gap-2 rounded text-sm text-muted hover:text-ink">
            <span aria-hidden>←</span> {back.label}
          </Link>
        )}
        {children}
      </main>
    </>
  );
}
