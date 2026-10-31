import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "ok" | "signal" | "danger" | "neutral" | "ink";

const tones: Record<Tone, string> = {
  ok: "bg-ok-soft text-ok-strong",
  signal: "bg-signal-soft text-signal",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-ink/6 text-muted",
  ink: "bg-ink text-paper",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}
