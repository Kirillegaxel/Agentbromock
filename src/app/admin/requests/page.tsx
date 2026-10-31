"use client";

import { useDeferredValue, useState } from "react";
import { AdminPageHead } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { TextField } from "@/components/ui/Field";
import { PageLoading } from "@/components/ui/Skeleton";
import { formatDateTime } from "@/domain/format";
import { CONTACT_CHANNELS } from "@/domain/labels";
import type { LeadRequest, RequestStatus } from "@/domain/types";
import { api, useAction, useRequests } from "@/lib/queries";
import { cn } from "@/lib/cn";

type TypeFilter = "all" | "waitlist" | "corporate";

export default function AdminRequestsPage() {
  const [type, setType] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const { data: requests, isPending } = useRequests({ type, query: deferred });
  const { data: all } = useRequests({ type: "all" });
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = {
    all: all?.length ?? 0,
    waitlist: all?.filter((r) => r.type === "waitlist").length ?? 0,
    corporate: all?.filter((r) => r.type === "corporate").length ?? 0,
  };

  return (
    <>
      <AdminPageHead
        title="Заявки"
        lead="Заявки в очередь на тариф и обращения от команд. Сообщения и приглашения отсюда не отправляются — свяжитесь с человеком сами по указанному контакту."
      />
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <ChoiceGroup
          legend="Вид заявки"
          name="request-type"
          variant="segments"
          value={type}
          onChange={setType}
          options={[
            { value: "all", label: `Все · ${counts.all}` },
            { value: "waitlist", label: `Очередь на тариф · ${counts.waitlist}` },
            { value: "corporate", label: `Корпоративные · ${counts.corporate}` },
          ]}
        />
        <TextField
          wrapperClassName="lg:w-80"
          label="Поиск"
          type="search"
          placeholder="Имя, контакт, тариф, компания"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isPending && !requests ? (
        <PageLoading />
      ) : !requests?.length ? (
        <div role="status" className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong bg-card px-6 py-14 text-center">
          <p className="text-lg font-semibold">{counts.all === 0 ? "Заявок пока нет" : "Ничего не найдено"}</p>
          <p className="max-w-md text-muted">
            {counts.all === 0
              ? "Когда посетитель оставит заявку на тариф без наличия или корпоративное обращение, оно появится здесь."
              : "Попробуйте изменить запрос или выбрать другой вид заявок."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Список заявок">
          {requests.map((r) => (
            <RequestItem key={r.id} request={r} open={openId === r.id} onToggle={() => setOpenId(openId === r.id ? null : r.id)} />
          ))}
        </ul>
      )}
    </>
  );
}

function RequestItem({ request: r, open, onToggle }: { request: LeadRequest; open: boolean; onToggle: () => void }) {
  const setStatus = useAction((s: RequestStatus) => api().admin.setRequestStatus(r.id, s));
  const title = r.type === "waitlist" ? `Тариф «${r.planName}»` : r.company;
  const detailId = `req-${r.id}`;
  return (
    <li className={cn("rounded-xl border bg-card transition-colors", open ? "border-ink" : "border-line")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={detailId}
        className="grid w-full grid-cols-1 items-center gap-2 px-5 py-4 text-left sm:grid-cols-[150px_1fr_auto] sm:gap-4"
      >
        <span>{r.type === "waitlist" ? <Badge tone="signal">очередь на тариф</Badge> : <Badge tone="ink">корпоративная</Badge>}</span>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{title}</span>
          <span className="block truncate text-sm text-muted">{r.name} · {r.contact}</span>
        </span>
        <span className="flex items-center gap-3 text-sm text-muted">
          {r.status === "new" ? <Badge tone="ok">новая</Badge> : <Badge>связались</Badge>}
          <time dateTime={new Date(r.createdAt).toISOString()}>{formatDateTime(r.createdAt)}</time>
        </span>
      </button>
      {open && (
        <div id={detailId} className="animate-fade border-t border-line px-5 py-5">
          <dl className="grid gap-4 text-[15px] sm:grid-cols-2">
            <div><dt className="text-sm text-muted">Имя</dt><dd className="font-medium">{r.name}</dd></div>
            <div>
              <dt className="text-sm text-muted">{CONTACT_CHANNELS[r.contactChannel].label}</dt>
              <dd className="font-mono font-medium select-all">{r.contact}</dd>
            </div>
            {r.type === "waitlist" ? (
              <>
                <div><dt className="text-sm text-muted">Тариф</dt><dd className="font-medium">{r.planName}</dd></div>
                <div className="sm:col-span-2"><dt className="text-sm text-muted">Комментарий</dt><dd className="whitespace-pre-wrap">{r.comment || "—"}</dd></div>
              </>
            ) : (
              <>
                <div><dt className="text-sm text-muted">Компания</dt><dd className="font-medium">{r.company}</dd></div>
                <div><dt className="text-sm text-muted">Размер команды</dt><dd className="font-medium">{r.teamSize}</dd></div>
                <div className="sm:col-span-2"><dt className="text-sm text-muted">Сообщение</dt><dd className="whitespace-pre-wrap">{r.message}</dd></div>
              </>
            )}
          </dl>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {r.status === "new" ? (
              <Button size="sm" variant="secondary" loading={setStatus.isPending} onClick={() => setStatus.mutate("contacted")}>
                Отметить: связались
              </Button>
            ) : (
              <Button size="sm" variant="ghost" loading={setStatus.isPending} onClick={() => setStatus.mutate("new")}>
                Вернуть в новые
              </Button>
            )}
            <span className="text-[13px] text-muted">Отметка нужна только вам — человеку ничего не отправляется.</span>
          </div>
        </div>
      )}
    </li>
  );
}
