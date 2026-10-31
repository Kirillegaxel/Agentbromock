import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginView } from "@/components/account/LoginView";
import { FlowShell } from "@/components/layout/FlowShell";
import { PageLoading } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Вход в кабинет" };

export default function LoginPage() {
  return (
    <FlowShell>
      <Suspense fallback={<PageLoading />}>
        <LoginView />
      </Suspense>
    </FlowShell>
  );
}
