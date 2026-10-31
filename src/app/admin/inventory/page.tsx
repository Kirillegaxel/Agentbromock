"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminPageHead } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SelectField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { PageLoading } from "@/components/ui/Skeleton";
import type { InventoryRow } from "@/data/api";
import { errorMessage } from "@/domain/errors";
import { accounts, formatDate } from "@/domain/format";
import { api, useAction, useInventory, useRequests } from "@/lib/queries";

export default function AdminInventoryPage() {
  const { data: inventory } = useInventory();
  return (
    <>
      <AdminPageHead
        title="Наличие аккаунтов"
        lead="Свободные аккаунты продаются на лендинге. Аккаунт, закреплённый за клиентом, не может одновременно считаться свободным."
      />
      {!inventory ? <PageLoading /> : (
        <div className="flex flex-col gap-6">
          {inventory.map((row) => <PlanInventory key={row.plan.id} row={row} />)}
        </div>
      )}
    </>
  );
}

function PlanInventory({ row }: { row: InventoryRow }) {
  const [count, setCount] = useState("3");
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const add = useAction((n: number) => api().admin.addAccounts(row.plan.id, n));
  const { data: waitlist } = useRequests({ type: "waitlist" });
  const waiting = waitlist?.filter((r) => r.type === "waitlist" && r.planId === row.plan.id && r.status === "new").length ?? 0;

  async function onConfirm() {
    try {
      const added = await add.mutateAsync(Number(count));
      setDone(`Добавлено: ${added.map((a) => a.label).join(", ")}.`);
    } finally {
      setConfirm(false);
    }
  }

  const visible = expanded ? row.accounts : row.accounts.slice(0, 6);

  return (
    <section aria-labelledby={`inv-${row.plan.id}`} className="rounded-xl border border-line bg-card">
      <div className="flex flex-wrap items-start justify-between gap-6 p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <h2 id={`inv-${row.plan.id}`} className="text-xl font-semibold">{row.plan.name}</h2>
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-[15px]">
            <div className="flex gap-1.5"><dt className="text-muted">Свободно</dt><dd className="font-semibold tabular-nums">{row.free}</dd></div>
            <div className="flex gap-1.5"><dt className="text-muted">Выдано</dt><dd className="font-semibold tabular-nums">{row.assigned}</dd></div>
            <div className="flex gap-1.5"><dt className="text-muted">Заблокировано</dt><dd className="font-semibold tabular-nums">{row.blocked}</dd></div>
          </dl>
          {row.free === 0 && <Badge tone="signal" className="self-start">на лендинге — «Оставить заявку в очередь»</Badge>}
        </div>
        <div className="flex items-end gap-2">
          <SelectField label="Добавить аккаунтов" value={count} onChange={(e) => setCount(e.target.value)} className="w-24">
            {[1, 2, 3, 5, 10].map((n) => <option key={n} value={n}>{n}</option>)}
          </SelectField>
          <Button onClick={() => { setDone(null); setConfirm(true); }}>Пополнить</Button>
        </div>
      </div>
      {(done || add.isError) && (
        <div className="px-5 pb-4 sm:px-6">
          {add.isError ? (
            <Notice tone="danger" role="alert">{errorMessage(add.error)}</Notice>
          ) : (
            <Notice tone="success" role="status" title="Наличие пополнено">
              {done} Лендинг уже показывает новое количество.
              {waiting > 0 && (
                <> В очереди на этот тариф {waiting} — приглашения не рассылаются автоматически, свяжитесь с людьми из{" "}
                  <Link href="/admin/requests" className="font-medium underline">раздела заявок</Link>.</>
              )}
            </Notice>
          )}
        </div>
      )}
      <div className="overflow-x-auto border-t border-line">
        <table className="w-full min-w-[560px] text-left text-sm">
          <caption className="sr-only">Аккаунты тарифа {row.plan.name}</caption>
          <thead className="text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="px-5 py-2.5 font-medium sm:px-6">Аккаунт</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Статус</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Клиент</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Подготовлен</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => (
              <tr key={a.id} className="border-b border-line/60 last:border-0">
                <td className="px-5 py-2.5 font-mono sm:px-6">{a.label}</td>
                <td className="px-3 py-2.5">
                  {a.status === "free" ? <Badge tone="ok">свободен</Badge> : a.status === "assigned" ? <Badge>закреплён</Badge> : <Badge tone="danger">заблокирован</Badge>}
                </td>
                <td className="px-3 py-2.5 text-muted">{a.assignedEmail ?? "—"}</td>
                <td className="px-3 py-2.5 text-muted">{formatDate(a.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {row.accounts.length > 6 && (
          <button type="button" onClick={() => setExpanded((e) => !e)} className="w-full border-t border-line py-2.5 text-sm text-muted hover:text-ink" aria-expanded={expanded}>
            {expanded ? "Свернуть" : `Показать все (${row.accounts.length})`}
          </button>
        )}
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={onConfirm}
        loading={add.isPending}
        title={`Добавить ${accounts(Number(count))} в «${row.plan.name}»?`}
        confirmLabel="Добавить"
      >
        Аккаунты сразу появятся в продаже. Заявителям из очереди ничего не отправляется и аккаунты им не назначаются.
        В прототипе доступы аккаунтов вымышленные.
      </ConfirmDialog>
    </section>
  );
}
