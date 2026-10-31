import type { Metadata } from "next";
import { RenewView } from "@/components/account/RenewView";
import { FlowShell } from "@/components/layout/FlowShell";

export const metadata: Metadata = { title: "Продление" };

export default function RenewPage() {
  return (
    <FlowShell back={{ href: "/account", label: "В кабинет" }}>
      <RenewView />
    </FlowShell>
  );
}
