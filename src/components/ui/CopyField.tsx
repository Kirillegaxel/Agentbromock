"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function CopyField({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState(!secret);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setShown(true);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <div className="flex items-center gap-1 rounded-lg border border-line bg-card py-1 pr-1 pl-3">
        <code className="min-w-0 flex-1 truncate font-mono text-[13px]" title={shown ? value : undefined}>
          {shown ? value : "•".repeat(Math.min(value.length, 16))}
        </code>
        {secret && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            className="rounded px-2 py-1 text-xs text-muted hover:bg-ink/5 hover:text-ink"
            aria-label={shown ? `Скрыть: ${label}` : `Показать: ${label}`}
          >
            {shown ? "Скрыть" : "Показать"}
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          className={cn(
            "min-w-24 rounded px-2 py-1 text-xs font-medium transition-colors",
            copied ? "bg-ink text-paper" : "hover:bg-ink/5",
          )}
          aria-label={`Скопировать: ${label}`}
        >
          {copied ? "Скопировано" : "Скопировать"}
        </button>
      </div>
      <span className="sr-only" aria-live="polite">
        {copied ? `${label} скопирован` : ""}
      </span>
    </div>
  );
}
