import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Состав покупки: строки, итог и примечание. */
export function Receipt({
  title,
  rows,
  total,
  footer,
  className,
  animate,
}: {
  title: ReactNode;
  rows: [ReactNode, ReactNode][];
  total?: [ReactNode, ReactNode];
  footer?: ReactNode;
  className?: string;
  animate?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl bg-sand/70 p-6", animate && "animate-print", className)}>
      <p className="font-semibold">{title}</p>
      <dl className="mt-3">
        {rows.map(([k, v], i) => (
          <div key={i} className="flex items-baseline justify-between gap-4 border-b border-ink/10 py-2.5 text-[15px] last:border-0">
            <dt className="text-muted">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      {total && (
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-ink/20 pt-4">
          <span className="font-medium">{total[0]}</span>
          <span className="text-2xl font-semibold tabular-nums">{total[1]}</span>
        </div>
      )}
      {footer && <p className="mt-4 text-[13px] leading-relaxed text-muted">{footer}</p>}
    </div>
  );
}
