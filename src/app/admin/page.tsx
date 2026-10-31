"use client";

import Link from "next/link";
import { AdminPageHead } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/Badge";
import { PageLoading } from "@/components/ui/Skeleton";
import { accounts, formatRub } from "@/domain/format";
import { useInventory, useLandingSettings, useRequests } from "@/lib/queries";

export default function AdminOverviewPage() {
  const { data: inventory } = useInventory();
  const { data: requests } = useRequests({ type: "all" });
  const { data: settings } = useLandingSettings();
  if (!inventory || !requests || !settings) return <PageLoading />;

  const fresh = requests.filter((r) => r.status === "new");
  return (
    <>
      <AdminPageHead title="Сводка" lead="Что сейчас видит покупатель на лендинге и что ждёт вашего ответа." />
      <div className="grid gap-4 lg:grid-cols-3">
        {inventory.map((row) => (
          <Link key={row.plan.id} href="/admin/inventory" className="group flex flex-col gap-3 rounded-xl border border-line bg-card p-5 transition-colors hover:border-ink">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{row.plan.name}</span>
              <span className="text-sm text-muted">{formatRub(row.plan.priceRub)}</span>
            </div>
            <p className="text-4xl font-medium tracking-tight tabular-nums">{row.free}</p>
            <p className="text-sm text-muted">
              {row.free === 0 ? "свободных нет — на лендинге открыта очередь" : `${accounts(row.free)} в продаже`} · выдано {row.assigned}
            </p>
          </Link>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Link href="/admin/requests" className="flex flex-col gap-2 rounded-xl border border-line bg-card p-5 hover:border-ink">
          <span className="font-semibold">Новые заявки</span>
          <p className="text-4xl font-medium tracking-tight">{fresh.length}</p>
          <p className="text-sm text-muted">
            в очередь: {fresh.filter((r) => r.type === "waitlist").length} · корпоративных: {fresh.filter((r) => r.type === "corporate").length}
          </p>
        </Link>
        <Link href="/admin/landing" className="flex flex-col gap-2 rounded-xl border border-line bg-card p-5 hover:border-ink">
          <span className="font-semibold">Корпоративный блок</span>
          <span>{settings.corporateBlockEnabled ? <Badge tone="ok">показан на лендинге</Badge> : <Badge>скрыт</Badge>}</span>
        </Link>
      </div>
    </>
  );
}
