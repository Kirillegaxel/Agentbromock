import type { Metadata, Viewport } from "next";
import { DemoPanel } from "@/components/demo/DemoPanel";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Hermes — готовый аккаунт для работы с ИИ", template: "%s · Hermes" },
  description:
    "Месячный доступ к готовому личному аккаунту для работы с ИИ над кодом и продуктами. Регистрацию и оплату аккаунта берём на себя. Прототип.",
};

export const viewport: Viewport = {
  themeColor: "#f3f0e8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-dvh">
        <Providers>
          {children}
          <DemoPanel />
        </Providers>
      </body>
    </html>
  );
}
