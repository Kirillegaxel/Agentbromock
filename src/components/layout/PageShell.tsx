import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function PageShell({ children, narrow, className }: { children: ReactNode; narrow?: boolean; className?: string }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className={cn("mx-auto w-full px-5 sm:px-8", narrow ? "max-w-3xl" : "max-w-6xl", className)}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
