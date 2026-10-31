import { accounts } from "@/domain/format";
import { cn } from "@/lib/cn";

/** Наличие: число и тонкая шкала из штучных ячеек. */
export function StockMeter({ available, className, dark }: { available: number; className?: string; dark?: boolean }) {
  const shown = Math.min(available, 12);
  const low = available <= 1;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className={dark ? "text-night-muted" : "text-muted"}>Свободно сейчас</span>
        <span className={cn("font-medium tabular-nums", available === 0 ? (dark ? "text-[#e7a58b]" : "text-brand-strong") : low ? (dark ? "text-[#e7a58b]" : "text-brand-strong") : dark ? "text-night-text" : "text-ink")}>
          {available === 0 ? "нет" : accounts(available)}
        </span>
      </div>
      <div aria-hidden className="flex h-1 gap-1">
        {available === 0 ? (
          <span className={cn("h-full flex-1 rounded-full", dark ? "bg-night-line" : "bg-ink/10")} />
        ) : (
          Array.from({ length: shown }, (_, i) => (
            <span
              key={i}
              className={cn("h-full flex-1 animate-rise rounded-full", low ? "bg-brand" : dark ? "bg-night-text" : "bg-ink")}
              style={{ animationDelay: `${i * 40}ms`, maxWidth: 32 }}
            />
          ))
        )}
      </div>
    </div>
  );
}
