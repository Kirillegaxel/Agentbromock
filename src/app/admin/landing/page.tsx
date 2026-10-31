"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminPageHead } from "@/components/admin/AdminShell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Notice } from "@/components/ui/Notice";
import { PageLoading } from "@/components/ui/Skeleton";
import { errorMessage } from "@/domain/errors";
import { api, useAction, useLandingSettings } from "@/lib/queries";
import { cn } from "@/lib/cn";

export default function AdminLandingPage() {
  const { data: settings } = useLandingSettings();
  const [confirm, setConfirm] = useState(false);
  const toggle = useAction((enabled: boolean) => api().admin.setCorporateBlock(enabled));

  if (!settings) return <PageLoading />;
  const enabled = settings.corporateBlockEnabled;

  return (
    <>
      <AdminPageHead
        title="Корпоративный блок"
        lead="Блок «Для команд» с формой заявки на лендинге. Когда он скрыт, корпоративные заявки не принимаются."
      />
      <section className="flex flex-col gap-5 rounded-xl border border-line bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p id="corp-label" className="text-lg font-semibold">Показывать блок на лендинге</p>
            <p className="text-sm text-muted">{enabled ? "Сейчас блок виден посетителям." : "Сейчас блок скрыт."}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-labelledby="corp-label"
            onClick={() => setConfirm(true)}
            className={cn(
              "relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors duration-200",
              enabled ? "border-ok bg-ok" : "border-line-strong bg-ink/10",
            )}
          >
            <span aria-hidden className={cn("absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform duration-200", enabled && "translate-x-6")} />
          </button>
        </div>
        {toggle.isError && <Notice tone="danger" role="alert">{errorMessage(toggle.error)}</Notice>}
        {toggle.isSuccess && (
          <Notice tone="success" role="status">
            {enabled ? "Блок показан." : "Блок скрыт."}{" "}
            <Link href="/#teams" className="font-medium underline">Проверить на лендинге</Link>
          </Notice>
        )}
      </section>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        loading={toggle.isPending}
        title={enabled ? "Скрыть корпоративный блок?" : "Показать корпоративный блок?"}
        confirmLabel={enabled ? "Скрыть" : "Показать"}
        tone={enabled ? "danger" : "primary"}
        onConfirm={async () => {
          await toggle.mutateAsync(!enabled).catch(() => undefined);
          setConfirm(false);
        }}
      >
        {enabled
          ? "Блок и форма исчезнут с лендинга. Уже полученные заявки останутся в разделе «Заявки»."
          : "На лендинге появится блок «Для команд» с формой заявки."}
      </ConfirmDialog>
    </>
  );
}
