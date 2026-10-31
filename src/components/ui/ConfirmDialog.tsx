"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./Button";

/** Подтверждение действия на нативном <dialog>: фокус, Esc и затемнение — из коробки. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  onConfirm,
  onClose,
  loading,
  tone = "primary",
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  tone?: "primary" | "danger";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(92vw,440px)] rounded-xl border border-ink bg-card p-0 text-ink shadow-xl"
    >
      <div className="flex flex-col gap-3 p-6">
        <h2 id="confirm-title" className="text-lg font-semibold">{title}</h2>
        {children && <div className="text-[15px] leading-relaxed text-ink/80">{children}</div>}
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} autoFocus>Отмена</Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </dialog>
  );
}
