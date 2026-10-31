import Link from "next/link";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-28 bg-night text-night-text">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 pt-16 pb-24 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo light />
          <p className="max-w-sm font-serif leading-relaxed text-night-muted">
            Интерактивный прототип. Платежи, аккаунты, доступы, контакты и отзывы вымышленные, данные никуда не отправляются.
          </p>
        </div>
        <nav aria-label="Сервис" className="flex flex-col gap-3 text-[15px]">
          <p className="text-night-muted">Сервис</p>
          <Link href="/#plans" className="hover:text-white">Тарифы</Link>
          <Link href="/#access" className="hover:text-white">UnoWork и BB</Link>
          <Link href="/#faq" className="hover:text-white">Вопросы</Link>
        </nav>
        <nav aria-label="Клиентам" className="flex flex-col gap-3 text-[15px]">
          <p className="text-night-muted">Клиентам</p>
          <Link href="/rules" className="hover:text-white">Правила использования</Link>
          <Link href="/account" className="hover:text-white">Личный кабинет</Link>
          <Link href="/admin" className="hover:text-white">Вход для администратора</Link>
        </nav>
      </div>
    </footer>
  );
}
