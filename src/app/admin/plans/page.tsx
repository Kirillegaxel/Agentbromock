"use client";

import { useState, type FormEvent } from "react";
import { AdminPageHead } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { TextArea, TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { PageLoading } from "@/components/ui/Skeleton";
import type { PlanPatch } from "@/data/api";
import { DomainError, errorMessage } from "@/domain/errors";
import { formatRub } from "@/domain/format";
import type { PlanWithAvailability } from "@/domain/types";
import { validatePrice } from "@/domain/validation";
import { api, useAction, useAdminPlans } from "@/lib/queries";

export default function AdminPlansPage() {
  const { data: plans } = useAdminPlans();
  return (
    <>
      <AdminPageHead
        title="Тарифы и цены"
        lead="Изменения сразу видны на лендинге и при следующем открытии покупки. Уже оформленные покупки сохраняют сумму, по которой были оплачены; уже открытая страница оплаты — тоже."
      />
      {!plans ? <PageLoading /> : (
        <div className="flex flex-col gap-6">
          {plans.map((p) => <PlanEditor key={p.id} plan={p} />)}
        </div>
      )}
    </>
  );
}

function PlanEditor({ plan }: { plan: PlanWithAvailability }) {
  const initial = () => ({
    name: plan.name,
    tagline: plan.tagline,
    description: plan.description,
    features: plan.features.join("\n"),
    price: String(plan.priceRub),
  });
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saved, setSaved] = useState(false);
  const save = useAction((patch: PlanPatch) => api().admin.updatePlan(plan.id, patch));

  const dirty = JSON.stringify(form) !== JSON.stringify(initial());
  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const priceError = validatePrice(form.price);
    if (priceError) return setErrors({ price: priceError });
    try {
      await save.mutateAsync({
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        features: form.features.split("\n"),
        priceRub: Number(form.price),
      });
      setSaved(true);
    } catch (err) {
      if (err instanceof DomainError && err.fields)
        setErrors({ ...err.fields, price: err.fields.priceRub });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-labelledby={`plan-${plan.id}`} className="rounded-xl border border-line bg-card p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 id={`plan-${plan.id}`} className="text-xl font-semibold">{plan.name}</h2>
        <span className="text-sm text-muted">на лендинге сейчас: {formatRub(plan.priceRub)} · свободно {plan.available}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Название" value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <TextField
          label="Цена за месяц, ₽"
          inputMode="numeric"
          value={form.price}
          onChange={(e) => set("price", e.target.value.replace(/[^\d]/g, ""))}
          error={errors.price}
          hint="Целое число рублей"
        />
        <TextField wrapperClassName="md:col-span-2" label="Подзаголовок" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
        <TextArea label="Описание" value={form.description} onChange={(e) => set("description", e.target.value)} error={errors.description} />
        <TextArea label="Условия" hint="По одному пункту в строке" value={form.features} onChange={(e) => set("features", e.target.value)} error={errors.features} />
      </div>
      {save.isError && !(save.error instanceof DomainError && save.error.fields) && (
        <Notice tone="danger" role="alert" className="mt-4">{errorMessage(save.error)}</Notice>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!dirty} loading={save.isPending}>Сохранить</Button>
        {dirty && (
          <Button variant="ghost" onClick={() => { setForm(initial()); setErrors({}); }}>Отменить изменения</Button>
        )}
        <span role="status" className="text-sm font-medium text-ok">
          {saved && !dirty ? "Сохранено — лендинг уже обновлён." : ""}
        </span>
      </div>
    </form>
  );
}
