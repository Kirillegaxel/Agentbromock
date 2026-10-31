import type { Metadata } from "next";
import { AccountView } from "@/components/account/AccountView";
import { FlowShell } from "@/components/layout/FlowShell";

export const metadata: Metadata = { title: "Личный кабинет" };

export default function AccountPage() {
  return (
    <FlowShell>
      <AccountView />
    </FlowShell>
  );
}
