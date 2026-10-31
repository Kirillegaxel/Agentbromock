import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "danger" | "neutral";

const tones: Record<Tone, string> = {
  info: "bg-sand/70",
  success: "bg-ok-soft",
  warning: "bg-signal-soft",
  danger: "bg-danger-soft",
  neutral: "bg-card border border-line",
};

const titleTones: Record<Tone, string> = {
  info: "",
  success: "text-ok-strong",
  warning: "text-signal",
  danger: "text-danger",
  neutral: "",
};

export function Notice({
  tone = "info",
  title,
  children,
  className,
  role,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  role?: "status" | "alert";
}) {
  return (
    <div role={role} className={cn("rounded-xl px-5 py-4 text-[15px]", tones[tone], className)}>
      {title && <p className={cn("font-semibold", titleTones[tone])}>{title}</p>}
      {children && <div className={cn("leading-relaxed text-ink/80", title ? "mt-1" : undefined)}>{children}</div>}
    </div>
  );
}
