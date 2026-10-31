import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutView } from "@/components/purchase/CheckoutView";
import { FlowShell } from "@/components/layout/FlowShell";
import { PageLoading } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Покупка" };

export default async function BuyPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  return (
    <FlowShell back={{ href: "/#plans", label: "К тарифам" }}>
      <Suspense fallback={<PageLoading />}>
        <CheckoutView planId={planId} />
      </Suspense>
    </FlowShell>
  );
}
