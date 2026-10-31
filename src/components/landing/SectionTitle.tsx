import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SectionTitle({
  id,
  title,
  lead,
  dark,
  className,
}: {
  id: string;
  title: ReactNode;
  lead?: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex max-w-3xl flex-col gap-5", className)}>
      <h2 id={id} className={cn("text-[34px] leading-[1.1] font-medium tracking-[-0.025em] sm:text-[44px]", dark && "text-night-text")}>
        {title}
      </h2>
      {lead && (
        <p className={cn("font-serif text-[19px] leading-relaxed", dark ? "text-night-muted" : "text-ink/75")}>{lead}</p>
      )}
    </div>
  );
}
