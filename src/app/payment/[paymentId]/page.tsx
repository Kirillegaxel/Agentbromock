import type { Metadata } from "next";
import { FlowShell } from "@/components/layout/FlowShell";
import { PaymentResultView } from "@/components/purchase/PaymentResultView";

export const metadata: Metadata = { title: "Результат оплаты" };

export default async function PaymentResultPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  return (
    <FlowShell>
      <PaymentResultView paymentId={paymentId} />
    </FlowShell>
  );
}
