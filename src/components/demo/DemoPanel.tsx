"use client";

/**
 * Демо-панель проверяющего. Служебный инструмент: выбор роли, перемотка времени,
 * подстановка состояний и сброс. Визуально отделена от продукта (жёлто-чёрная лента)
 * и работает через DemoControls, а не через HermesApi.
 */
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { getDataLayer } from "@/data";
import type { DemoPhase, DemoSnapshot, DemoUserKey } from "@/data/demo/demoControls";
import { DEMO_ADMIN, DEMO_PASSWORD, DEMO_USERS } from "@/data/mock/seed";
import { ASSUMPTIONS } from "@/domain/assumptions";
import { errorMessage } from "@/domain/errors";
import { formatDate } from "@/domain/format";
import type { IncidentStatus } from "@/domain/types";
import { cn } from "@/lib/cn";

export function DemoPanel() {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const show = () => {
    ref.current?.showModal();
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="fixed bottom-3 left-3 z-50 flex items-center gap-2 rounded-full bg-ink p-1 text-[13px] font-medium text-paper shadow-lg ring-2 ring-tape transition-transform hover:-translate-y-0.5 sm:pr-3.5 print:hidden"
        aria-haspopup="dialog"
        aria-label="Демо-панель"
      >
        <span aria-hidden className="tape size-7 rounded-full sm:size-6" />
        <span aria-hidden className="hidden sm:inline">Демо-панель</span>
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        aria-label="Демо-панель проверяющего"
        className="m-0 ml-auto h-dvh max-h-dvh w-[min(100vw,420px)] max-w-none border-0 bg-[#1c1b16] p-0 text-[#f3f0e8] shadow-2xl"
      >
        {open && <PanelBody onClose={() => ref.current?.close()} />}
      </dialog>
    </>
  );
}

function PanelBody({ onClose }: { onClose: () => void }) {
  const { demo } = getDataLayer();
  const router = useRouter();
  const qc = useQueryClient();
  const [snap, setSnap] = useState<DemoSnapshot>(() => demo.snapshot());
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const refresh = useCallback(() => setSnap(demo.snapshot()), [demo]);
  useEffect(() => getDataLayer().api.subscribe(refresh), [refresh]);

  const run = (fn: () => void, message: string, go?: string) => {
    setError(null);
    try {
      fn();
      setFlash(message);
      void qc.invalidateQueries();
      if (go) {
        router.push(go);
        onClose();
      }
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const who = (key: DemoUserKey | "admin" | "guest") =>
    run(() => demo.signInAs(key), "Роль переключена", key === "guest" ? "/" : key === "admin" ? "/admin" : "/account");

  const hasSub = snap.role === "client" && snap.hasSubscription;

  return (
    <div className="flex h-full flex-col">
      <div className="tape h-2 shrink-0" aria-hidden />
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div>
          <h2 className="font-semibold">Демо-панель проверяющего</h2>
          <p className="mt-0.5 text-[13px] text-white/60">Служебный инструмент прототипа, не часть продукта.</p>
        </div>
        <button type="button" onClick={onClose} className="-mr-2 rounded px-2 py-1 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Закрыть демо-панель">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8 text-sm">
        <div className="sticky top-0 z-10 -mx-5 border-b border-white/10 bg-[#1c1b16] px-5 py-3 text-[13px]">
          <p>
            Сейчас: <strong>{snap.role === "admin" ? "администратор" : snap.userEmail ?? "гость"}</strong>
          </p>
          <p className="text-white/60">
            Демо-дата: {formatDate(snap.now)}
            {snap.clockOffsetDays !== 0 && ` (сдвиг ${snap.clockOffsetDays > 0 ? "+" : ""}${snap.clockOffsetDays} дн.)`}
          </p>
          <p role="status" className="min-h-[1.25rem] text-tape">{error ? <span className="text-[#ff9b8a]">{error}</span> : flash}</p>
        </div>

        <Group title="Войти как">
          <div className="grid gap-1.5">
            <DemoBtn onClick={() => who("guest")} active={snap.role === "guest"}>Гость — без входа</DemoBtn>
            {(Object.keys(DEMO_USERS) as DemoUserKey[]).map((k) => (
              <DemoBtn key={k} onClick={() => who(k)} active={snap.userEmail === DEMO_USERS[k].email}>
                {DEMO_USERS[k].name} — {DEMO_USERS[k].hint.toLowerCase()}
              </DemoBtn>
            ))}
            <DemoBtn onClick={() => who("admin")} active={snap.role === "admin"}>Администратор</DemoBtn>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-white/50">
            Пароль демо-клиентов: <code className="text-white/80">{DEMO_PASSWORD}</code>. Администратор:{" "}
            <code className="text-white/80">{DEMO_ADMIN.email}</code> / <code className="text-white/80">{DEMO_ADMIN.password}</code>
          </p>
        </Group>

        <Group title="Демо-время">
          <div className="flex flex-wrap gap-1.5">
            {[1, 3, 7, 30].map((d) => (
              <DemoBtn key={d} inline onClick={() => run(() => demo.shiftClock(d), `Время сдвинуто на +${d} дн.`)}>+{d} дн.</DemoBtn>
            ))}
            <DemoBtn inline onClick={() => run(() => demo.resetClock(), "Время вернулось к реальному")} disabled={snap.clockOffsetDays === 0}>
              Реальное время
            </DemoBtn>
          </div>
          <p className="mt-2 text-[12px] text-white/50">Двигает «сейчас» для всех сроков, не дожидаясь конца месяца.</p>
        </Group>

        <Group title="Срок подписки текущего клиента" disabled={!hasSub}>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                ["active", "Действует (20 дн.)"],
                ["expiring", "Скоро конец (2 дн.)"],
                ["grace", "Истекла, сохранён"],
                ["storage_over", "Хранение истекло"],
              ] as [DemoPhase, string][]
            ).map(([p, label]) => (
              <DemoBtn key={p} disabled={!hasSub} onClick={() => run(() => demo.setPhase(p), `Состояние: ${label.toLowerCase()}`)}>
                {label}
              </DemoBtn>
            ))}
          </div>
        </Group>

        <Group title="Блокировка и решение о замене" disabled={!hasSub}>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                ["none", "Без блокировки"],
                ["blocked", "Заблокирован"],
                ["review", "Рассматривается"],
                ["replaced", "Замена выдана"],
                ["denied", "Отказ в замене"],
              ] as [IncidentStatus | "none", string][]
            ).map(([s, label]) => (
              <DemoBtn
                key={s}
                disabled={!hasSub}
                active={hasSub && (snap.incident ?? "none") === s}
                onClick={() => run(() => demo.setIncident(s), `Блокировка: ${label.toLowerCase()}`)}
              >
                {label}
              </DemoBtn>
            ))}
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-white/50">
            Результат проверки логов вымышленный. Замена берёт свободный аккаунт того же тарифа из наличия.
          </p>
        </Group>

        <Group title="Заявки">
          <div className="flex flex-wrap gap-1.5">
            <DemoBtn inline onClick={() => run(() => demo.clearRequests(), "Заявки очищены")} disabled={snap.requestsCount === 0}>
              Очистить все ({snap.requestsCount})
            </DemoBtn>
            <DemoBtn inline onClick={() => run(() => demo.restoreSampleRequests(), "Примеры заявок восстановлены")}>Вернуть примеры</DemoBtn>
          </div>
        </Group>

        <Group title="Оплата">
          <p className="leading-relaxed text-white/70">
            На тестовой странице оплаты: <code>4242 4242 4242 4242</code> — успех, <code>4000 0000 0000 0002</code> — отказ
            банка, кнопка «Отменить» — отмена.
          </p>
        </Group>

        <Group title="Допущения прототипа">
          <ul className="flex list-disc flex-col gap-1 pl-4 text-[13px] leading-relaxed text-white/70">
            <li>Вход: почта из покупки + пароль, созданный после оплаты. Почта не подтверждается.</li>
            <li>«Месяц» = {ASSUMPTIONS.periodDays} дней; «скоро закончится» — за {ASSUMPTIONS.expiringSoonDays} дней.</li>
            <li>Досрочное продление добавляет месяц к дате окончания, после окончания — от момента оплаты.</li>
            <li>После окончания аккаунт хранится {ASSUMPTIONS.graceDays} дней, работа приостановлена, в продажу сам не возвращается.</li>
            <li>Цена фиксируется при переходе к оплате.</li>
          </ul>
          <p className="mt-2 text-[12px] text-white/50">Полный список — docs/assumptions.md.</p>
        </Group>

        <Group title="Сброс">
          {confirmReset ? (
            <div className="flex flex-col gap-2 rounded-md border border-[#ff9b8a]/50 p-3">
              <p>Вернуть исходные данные? Покупки, заявки, цены и сдвиг времени будут сброшены.</p>
              <div className="flex gap-1.5">
                <DemoBtn inline danger onClick={() => { run(() => demo.reset(), "Демо сброшено", "/"); setConfirmReset(false); }}>
                  Да, сбросить
                </DemoBtn>
                <DemoBtn inline onClick={() => setConfirmReset(false)}>Отмена</DemoBtn>
              </div>
            </div>
          ) : (
            <DemoBtn inline danger onClick={() => setConfirmReset(true)}>Сбросить демо к исходным данным</DemoBtn>
          )}
        </Group>
      </div>
    </div>
  );
}

function Group({ title, children, disabled }: { title: string; children: ReactNode; disabled?: boolean }) {
  return (
    <section className={cn("mt-5", disabled && "opacity-60")}>
      <h3 className="text-sm mb-2 text-[11px] tracking-wider text-white/50">{title}</h3>
      {disabled && <p className="mb-2 text-[12px] text-white/50">Войдите как клиент с подпиской (Борис, Вера, Глеб или Дина).</p>}
      {children}
    </section>
  );
}

function DemoBtn({
  children,
  onClick,
  active,
  disabled,
  inline,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  inline?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active || undefined}
      className={cn(
        "rounded-md border px-3 py-2 text-left text-[13px] transition-colors focus-visible:outline-tape disabled:cursor-not-allowed disabled:opacity-40",
        inline ? "inline-flex" : "w-full",
        active ? "border-tape bg-tape text-ink" : danger ? "border-[#ff9b8a]/50 text-[#ffb8aa] hover:bg-[#ff9b8a]/10" : "border-white/15 hover:border-white/40 hover:bg-white/5",
      )}
    >
      {children}
    </button>
  );
}
