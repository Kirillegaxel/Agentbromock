"use client";

/**
 * Имитация внешней страницы платёжной системы («Все платежи» или Wata).
 * В продукте этой страницы нет: покупатель уходит к провайдеру, а итог приходит на бэкенд.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { getDataLayer } from "@/data";
import type { Payment } from "@/domain/types";
import { formatRub } from "@/domain/format";
import { PROVIDERS } from "@/domain/labels";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { Button } from "../ui/Button";
import { focusFirstInvalid, TextField } from "../ui/Field";
import { Notice } from "../ui/Notice";
import { PageLoading } from "../ui/Skeleton";

const TEST_CARDS = {
  success: "4242 4242 4242 4242",
  decline: "4000 0000 0000 0002",
};

function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export function GatewayView({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [payment, setPayment] = useState<Payment | null | undefined>(undefined);
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [stage, setStage] = useState<"idle" | "processing" | "cancelling">("idle");
  const busy = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    getDataLayer().gateway.getPayment(paymentId).then(setPayment);
  }, [paymentId]);

  if (payment === undefined) return <div className="mx-auto max-w-md px-5"><PageLoading /></div>;
  if (payment === null)
    return (
      <div className="mx-auto max-w-md px-5 py-16">
        <Notice tone="warning" title="Платёж не найден">
          <Link href="/" className="underline">На главную Hermes</Link>
        </Notice>
      </div>
    );

  const provider = PROVIDERS[payment.provider];
  const isWata = payment.provider === "wata";
  const resultUrl = `/payment/${payment.id}`;

  async function finish(outcome: "success" | "decline" | "cancel") {
    if (busy.current) return; // защита от двойного нажатия
    busy.current = true;
    setStage(outcome === "cancel" ? "cancelling" : "processing");
    await new Promise((r) => setTimeout(r, outcome === "cancel" ? 300 : 1100));
    await getDataLayer().gateway.complete(paymentId, outcome);
    await qc.invalidateQueries();
    router.replace(resultUrl);
  }

  function onPay(e: FormEvent) {
    e.preventDefault();
    const digits = card.replace(/\D/g, "");
    const [mm, yy] = expiry.split("/").map(Number);
    const next = {
      card: digits.length !== 16 || !luhn(digits) ? "Проверьте номер карты." : undefined,
      expiry: !mm || mm > 12 || !yy || yy < 26 ? "Укажите срок в формате ММ/ГГ." : undefined,
      cvc: !/^\d{3}$/.test(cvc) ? "Три цифры с обратной стороны карты." : undefined,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return focusFirstInvalid(formRef.current);
    void finish(digits === TEST_CARDS.decline.replace(/\s/g, "") ? "decline" : "success");
  }

  const fill = (kind: keyof typeof TEST_CARDS) => {
    setCard(TEST_CARDS[kind]);
    setExpiry("12/29");
    setCvc("123");
    setErrors({});
  };

  return (
    <div className={cn("min-h-dvh", isWata ? "bg-[#eef0f7]" : "bg-[#eef4f3]")}>
      <div className="tape h-1.5" aria-hidden />
      <p className="bg-ink px-4 py-2 text-center text-[13px] text-paper">
        Тестовая страница оплаты — имитация «{provider.name}» для прототипа. Деньги не списываются.
      </p>
      <main id="main" className="mx-auto flex max-w-md flex-col gap-5 px-5 py-10">
        <header className="flex items-center justify-between">
          <span className={cn("font-mono text-lg font-bold tracking-tight", isWata ? "text-[#3b3fb6]" : "text-[#0f6b5c]")}>
            {isWata ? "wata" : "Все платежи"}
          </span>
          <span className="text-xs text-muted">Защищённое соединение (демо)</span>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_8px_24px_rgb(0_0_0/0.06)]">
          <p className="text-sm text-muted">Получатель: Hermes</p>
          <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">{formatRub(payment.amountRub)}</p>
          <p className="mt-1 text-sm">
            {payment.kind === "purchase" ? "Покупка" : "Продление"}: тариф «{payment.planName}», 30 дней
          </p>

          {payment.status !== "pending" ? (
            <Notice tone="neutral" className="mt-6" title="Этот платёж уже обработан">
              Повторная оплата не требуется.{" "}
              <Link href={resultUrl} className="font-medium underline">Вернуться в Hermes</Link>
            </Notice>
          ) : stage !== "idle" ? (
            <div role="status" className="mt-8 flex flex-col items-center gap-3 py-8 text-center">
              <span className={cn("size-10 animate-spin rounded-full border-[3px] border-r-transparent motion-reduce:animate-none", isWata ? "border-[#3b3fb6]" : "border-[#0f6b5c]")} />
              <p className="font-medium">{stage === "processing" ? "Связываемся с банком…" : "Возвращаемся в магазин…"}</p>
              <p className="text-sm text-muted">Не закрывайте страницу</p>
            </div>
          ) : (
            <form ref={formRef} onSubmit={onPay} noValidate className="mt-6 flex flex-col gap-4">
              <TextField
                label="Номер карты"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="0000 0000 0000 0000"
                value={card}
                onChange={(e) => setCard(formatCard(e.target.value))}
                error={errors.card}
              />
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Срок" inputMode="numeric" autoComplete="cc-exp" placeholder="ММ/ГГ" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} error={errors.expiry} />
                <TextField label="CVC" inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))} error={errors.cvc} />
              </div>
              <Button type="submit" size="lg" className={cn("mt-2 w-full", isWata ? "bg-[#3b3fb6] hover:bg-[#30339a]" : "bg-[#0f6b5c] hover:bg-[#0b5549]")}>
                Оплатить {formatRub(payment.amountRub)}
              </Button>
              <Button variant="ghost" onClick={() => finish("cancel")} className="w-full">
                Отменить и вернуться в Hermes
              </Button>
            </form>
          )}
        </section>

        {payment.status === "pending" && stage === "idle" && (
          <section aria-label="Тестовые карты" className="rounded-xl border border-dashed border-ink/30 p-4 text-sm">
            <p className="font-medium">Тестовые карты</p>
            <p className="mt-1 text-muted">Нажмите, чтобы подставить данные. Подойдёт любой срок в будущем и любой CVC.</p>
            <div className="mt-3 flex flex-col gap-2">
              <button type="button" onClick={() => fill("success")} className="flex justify-between gap-3 rounded-md bg-white px-3 py-2 text-left hover:ring-1 hover:ring-ink/30">
                <code className="font-mono">{TEST_CARDS.success}</code>
                <span className="text-ok">оплата пройдёт</span>
              </button>
              <button type="button" onClick={() => fill("decline")} className="flex justify-between gap-3 rounded-md bg-white px-3 py-2 text-left hover:ring-1 hover:ring-ink/30">
                <code className="font-mono">{TEST_CARDS.decline}</code>
                <span className="text-danger">банк отклонит</span>
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
