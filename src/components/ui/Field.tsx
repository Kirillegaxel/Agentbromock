"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-lg border bg-card px-3.5 text-[15px] text-ink placeholder:text-muted/70 transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-0 disabled:opacity-60";

function controlClass(invalid: boolean, extra?: string) {
  return cn(control, invalid ? "border-danger" : "border-line-strong hover:border-ink/60", extra);
}

interface FieldShellProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

export function FieldShell({ label, hint, error, optional, className, children }: FieldShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional && <span className="ml-1.5 font-normal text-muted">необязательно</span>}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-[13px] text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="animate-fade text-[13px] font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type Common = { label: ReactNode; hint?: ReactNode; error?: string; optional?: boolean; wrapperClassName?: string };

export function TextField({ label, hint, error, optional, wrapperClassName, className, ...rest }: Common & ComponentProps<"input">) {
  return (
    <FieldShell label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={controlClass(invalid, cn("h-11", className))}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

export function TextArea({ label, hint, error, optional, wrapperClassName, className, ...rest }: Common & ComponentProps<"textarea">) {
  return (
    <FieldShell label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={controlClass(invalid, cn("min-h-24 py-2.5 leading-relaxed", className))}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

export function SelectField({ label, hint, error, optional, wrapperClassName, className, children, ...rest }: Common & ComponentProps<"select">) {
  return (
    <FieldShell label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={controlClass(invalid, cn("h-11 appearance-none bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-9", className))}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2317160f' stroke-width='1.6' fill='none'/%3E%3C/svg%3E\")",
          }}
          {...rest}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
}

export function Checkbox({
  label,
  error,
  className,
  ...rest
}: { label: ReactNode; error?: string } & Omit<ComponentProps<"input">, "type">) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-ink"
          {...rest}
        />
        <span>{label}</span>
      </label>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 pl-8 text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Переводит фокус на первое поле с ошибкой — удобно при отправке с клавиатуры. */
export function focusFirstInvalid(form: HTMLFormElement | null) {
  requestAnimationFrame(() => {
    form?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
  });
}
