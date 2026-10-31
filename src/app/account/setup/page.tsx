import type { Metadata } from "next";
import { SetupPasswordView } from "@/components/account/SetupPasswordView";
import { FlowShell } from "@/components/layout/FlowShell";

export const metadata: Metadata = { title: "Пароль для входа" };

export default function SetupPage() {
  return (
    <FlowShell>
      <SetupPasswordView />
    </FlowShell>
  );
}
