"use client";

import { PROVIDERS } from "@/domain/labels";
import type { PaymentProvider } from "@/domain/types";
import { ChoiceGroup } from "../ui/ChoiceGroup";

export function ProviderPicker({
  value,
  onChange,
  error,
}: {
  value: PaymentProvider | null;
  onChange: (p: PaymentProvider) => void;
  error?: string;
}) {
  return (
    <ChoiceGroup
      legend="Способ оплаты"
      name="provider"
      value={value}
      onChange={onChange}
      error={error}
      options={(Object.keys(PROVIDERS) as PaymentProvider[]).map((p) => ({
        value: p,
        label: PROVIDERS[p].name,
        description: PROVIDERS[p].note,
      }))}
    />
  );
}
