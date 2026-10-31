"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Option<T extends string> {
  value: T;
  label: ReactNode;
  description?: ReactNode;
}

/** Группа радиокнопок в виде карточек или сегментов. Стрелки работают нативно. */
export function ChoiceGroup<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
  variant = "cards",
  error,
  className,
}: {
  legend: ReactNode;
  name: string;
  value: T | null;
  onChange: (value: T) => void;
  options: Option<T>[];
  variant?: "cards" | "segments";
  error?: string;
  className?: string;
}) {
  const errorId = useId();
  return (
    <fieldset className={cn("min-w-0", className)} aria-describedby={error ? errorId : undefined}>
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      <div className={cn(variant === "cards" ? "grid gap-2 sm:grid-cols-2" : "inline-flex flex-wrap rounded-lg bg-sand p-1")}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={cn(
                "relative cursor-pointer transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand",
                variant === "cards"
                  ? cn(
                      "flex flex-col gap-0.5 rounded-xl border p-4 pr-10",
                      checked ? "border-ink bg-card shadow-[inset_0_0_0_1px_var(--color-ink)]" : "border-line-strong bg-card/60 hover:border-ink/60",
                      error && !checked && "border-danger/60",
                    )
                  : cn("rounded-md px-3 py-1.5 text-sm", checked ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"),
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <span className={cn(variant === "cards" && "font-medium")}>{o.label}</span>
              {o.description && <span className="text-[13px] text-muted">{o.description}</span>}
              {variant === "cards" && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-3.5 right-3.5 grid size-5 place-items-center rounded-full border transition-colors",
                    checked ? "border-ink bg-ink" : "border-line-strong",
                  )}
                >
                  {checked && <span className="size-2 rounded-full bg-paper" />}
                </span>
              )}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
