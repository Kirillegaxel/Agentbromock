import type { Metadata } from "next";
import { GatewayView } from "@/components/purchase/GatewayView";

export const metadata: Metadata = { title: "Оплата (имитация)" };

export default async function GatewayPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  return <GatewayView paymentId={paymentId} />;
}
