"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { MyAccess } from "@/data/api";
import { cn } from "@/lib/cn";
import { Button } from "../ui/Button";
import { CopyField } from "../ui/CopyField";
import { Notice } from "../ui/Notice";

type Tab = "unowork" | "bb";

const TABS: { id: Tab; label: string; note: string }[] = [
  { id: "unowork", label: "UnoWork", note: "в браузере" },
  { id: "bb", label: "BB", note: "подключение к серверу" },
];

export function AccessTabs({ access }: { access: MyAccess }) {
  const [tab, setTab] = useState<Tab>("unowork");
  const refs = useRef<Record<Tab, HTMLButtonElement | null>>({ unowork: null, bb: null });
  const { account, view } = access;
  const creds = account.credentials;
  const available = view.access === "ok";

  function onKey(e: KeyboardEvent) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const idx = TABS.findIndex((t) => t.id === tab);
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : (idx + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    setTab(TABS[next].id);
    refs.current[TABS[next].id]?.focus();
  }

  const unavailableText =
    view.access === "paused_unpaid"
      ? "Работа приостановлена: оплаченный срок закончился. Доступы появятся снова сразу после продления."
      : view.access === "review"
        ? "Доступы скрыты, пока рассматривается обращение по блокировке."
        : "Доступы недоступны: аккаунт заблокирован.";

  return (
    <section aria-labelledby="access-title" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 id="access-title" className="text-xl font-semibold">Как подключиться</h2>
        <p className="text-ink/75">
          Оба способа ведут в одну и ту же серверную среду с вашим аккаунтом. Пользуйтесь любым или обоими.
        </p>
      </div>

      <div role="tablist" aria-label="Способ подключения" className="flex gap-1 border-b border-line" onKeyDown={onKey}>
        {TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative -mb-px flex items-baseline gap-2 border-b-2 px-4 py-3 transition-colors",
              tab === t.id ? "border-ink font-semibold" : "border-transparent text-muted hover:text-ink",
            )}
          >
            <span>{t.label}</span>
            <span className="hidden text-xs font-normal text-muted sm:inline">{t.note}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0} className="grid gap-8 lg:grid-cols-[1fr_1fr]" key={tab}>
        <div className="flex animate-fade flex-col gap-4">
          <h3 className="font-semibold">Доступы {tab === "unowork" ? "для UnoWork" : "для BB"}</h3>
          {available ? (
            tab === "unowork" ? (
              <>
                <CopyField label="Адрес рабочего пространства" value={creds.unowork.workspaceUrl} />
                <CopyField label="Логин" value={creds.unowork.login} />
                <CopyField label="Пароль" value={creds.unowork.password} secret />
              </>
            ) : (
              <>
                <CopyField label="Адрес сервера" value={creds.bb.host} />
                <CopyField label="Пользователь" value={creds.bb.user} />
                <CopyField label="Ключ доступа" value={creds.bb.accessKey} secret />
              </>
            )
          ) : (
            <Notice tone="neutral">{unavailableText}</Notice>
          )}
          <p className="text-[13px] text-muted">Доступы демонстрационные и никуда не подключают.</p>
        </div>
        <div className="flex animate-fade flex-col gap-4">
          <h3 className="font-semibold">Пошагово</h3>
          <ol className="flex flex-col gap-3">
            {(tab === "unowork" ? UNOWORK_STEPS : BB_STEPS).map((step, i) => (
              <li key={i} className="grid grid-cols-[1.75rem_1fr] gap-2 leading-relaxed">
                <span className="text-muted tabular-nums">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <ConnectionCheck key={`${tab}-${account.id}`} target={tab} disabled={!available} />
        </div>
      </div>
    </section>
  );
}

const UNOWORK_STEPS = [
  "Откройте адрес рабочего пространства в браузере — на компьютере или планшете.",
  "Войдите по логину и паролю из этого раздела.",
  "В рабочем пространстве уже запущена серверная среда с Hermes и вашим аккаунтом — ничего устанавливать не нужно.",
  "Работайте прямо в браузере. Можно закрыть вкладку и вернуться позже: среда остаётся на сервере.",
];

const BB_STEPS = [
  "Откройте BB и создайте новое подключение к серверу.",
  "Укажите адрес сервера и пользователя из этого раздела.",
  "Вставьте ключ доступа. Храните его так же, как пароль, и никому не передавайте.",
  "Подключитесь: вы окажетесь в той же серверной среде Hermes, что и через UnoWork.",
];

function ConnectionCheck({ target, disabled }: { target: Tab; disabled: boolean }) {
  const [state, setState] = useState<"idle" | "checking" | "ok">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function check() {
    setState("checking");
    timer.current = setTimeout(() => setState("ok"), 1200);
  }

  return (
    <div className="mt-2 flex flex-col gap-3 rounded-xl bg-sand/60 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={check} disabled={disabled} loading={state === "checking"} loadingText="Проверяем…">
          Проверить подключение
        </Button>
        <span className="text-[13px] text-muted">имитация, без настоящего соединения</span>
      </div>
      <p role="status" className="text-[15px]">
        {state === "ok" && (
          <span className="flex animate-rise items-center gap-2 font-medium text-ok">
            <span aria-hidden className="size-2 rounded-full bg-ok" />
            Серверная среда отвечает — можно работать через {target === "unowork" ? "UnoWork" : "BB"}.
          </span>
        )}
      </p>
    </div>
  );
}
