import type { Metadata } from "next";
import { Suspense } from "react";
import { FlowShell } from "@/components/layout/FlowShell";
import { WaitlistView } from "@/components/purchase/WaitlistView";
import { PageLoading } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Заявка в очередь" };

export default async function WaitlistPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  return (
    <FlowShell back={{ href: "/#plans", label: "К тарифам" }}>
      <Suspense fallback={<PageLoading />}>
        <WaitlistView planId={planId} />
      </Suspense>
    </FlowShell>
  );
}
