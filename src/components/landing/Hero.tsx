import { PixelArt } from "../pixel/PixelArt";
import { LIGHT, RACK } from "../pixel/sprites";
import { ButtonLink } from "../ui/Button";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="pt-14 pb-20 sm:pt-24 lg:pb-28">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_300px] lg:gap-20">
        <div className="flex flex-col gap-8">
          <h1
            id="hero-title"
            className="animate-rise text-[42px] leading-[1.04] font-medium tracking-[-0.035em] sm:text-[64px] lg:text-[70px]"
          >
            Готовый аккаунт для работы с ИИ. Регистрацию и оплату мы уже сделали.
          </h1>
          <p className="animate-rise max-w-2xl font-serif text-xl leading-relaxed text-ink/75 [animation-delay:80ms] sm:text-[22px]">
            Hermes выдаёт личный аккаунт на месяц. Он работает на нашем сервере, а вы подключаетесь к нему через UnoWork
            или BB — сразу после оплаты, без ожидания и ручной настройки.
          </p>
          <div className="animate-rise flex flex-wrap items-center gap-3 [animation-delay:160ms]">
            <ButtonLink href="/#plans" size="lg">
              Выбрать тариф
            </ButtonLink>
            <ButtonLink href="/#access" size="lg" variant="ghost">
              Где работает аккаунт <span aria-hidden>→</span>
            </ButtonLink>
          </div>
        </div>
        <div className="hidden justify-center lg:flex">
          <PixelArt art={RACK} palette={LIGHT} className="w-[260px]" />
        </div>
      </div>
    </section>
  );
}
