import Link from "next/link";
import { PixelArt } from "../pixel/PixelArt";
import { ICON_BOLT, ICON_BUBBLE, ICON_CARD, ICON_CHECK, ICON_LENS, ICON_LOCK, ICON_SHIELD, LIGHT } from "../pixel/sprites";
import { Reveal } from "../ui/Reveal";
import { ConnectDiagram } from "./ConnectDiagram";
import { SectionTitle } from "./SectionTitle";

export function ValueSection() {
  const items = [
    {
      icon: ICON_CARD,
      title: "Регистрировать и оплачивать аккаунт не нужно",
      text: "Это делаем мы. Не придётся искать подходящий способ оплаты, проходить проверки и разбираться с настройками.",
    },
    {
      icon: ICON_LOCK,
      title: "Аккаунт только ваш",
      text: "На оплаченный срок аккаунт закреплён за одним клиентом. Им не пользуются другие люди, ваша работа не смешивается с чужой.",
    },
    {
      icon: ICON_BOLT,
      title: "Начать можно сразу",
      text: "Свободный аккаунт назначается в момент оплаты. Доступы и инструкции появляются в личном кабинете, ручной подготовки ждать не нужно.",
    },
    {
      icon: ICON_SHIELD,
      title: "Меньше риска блокировки",
      text: "Аккаунт работает в той среде, для которой подготовлен, и не переезжает между устройствами. Это снижает риск блокировки, но не исключает его.",
    },
  ];
  return (
    <section id="value" aria-labelledby="value-title" className="grid gap-12 py-20 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
      <SectionTitle
        id="value-title"
        className="lg:sticky lg:top-28 lg:self-start"
        title="Работайте с ИИ, а не с регистрацией"
        lead="Hermes для тех, кто хочет работать с ИИ над кодом и продуктом. Подходит и разработчикам, и тем, кто пишет код от случая к случаю."
      />
      <div className="flex flex-col">
        {items.map((item, i) => (
          <Reveal
            key={item.title}
            delay={i * 50}
            className="grid grid-cols-[48px_1fr] gap-x-6 border-t border-line py-8 first:border-t-0 first:pt-0 lg:first:pt-2"
          >
            <div className="flex h-12 items-start justify-center pt-1">
              <PixelArt art={item.icon} palette={LIGHT} className="h-10 w-auto" />
            </div>
            <div>
              <h3 className="text-xl font-medium tracking-tight">{item.title}</h3>
              <p className="mt-2 font-serif text-lg leading-relaxed text-ink/75">{item.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function AccessSection() {
  return (
    <section id="access" aria-labelledby="access-title" className="relative left-1/2 my-8 w-screen -translate-x-1/2 bg-night py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionTitle
          id="access-title"
          dark
          title="Аккаунт работает на сервере. Вы подключаетесь к нему"
          lead="Hermes работает на VPS — удалённом сервере, который мы подготовили и поддерживаем. Ваш компьютер нужен только для подключения, поэтому не важно, с какого устройства вы заходите."
        />
        <ConnectDiagram className="mx-auto mt-16 w-[720px] max-w-full" />
        <div className="mt-16 grid gap-4 md:grid-cols-2">
          <Reveal>
            <article className="flex h-full flex-col gap-5 rounded-2xl bg-night-2 p-7 sm:p-8">
              <div className="rounded-lg border border-night-line px-4 py-2.5 font-mono text-[13px] text-night-muted">
                https://hm-w-0142.unowork.demo
              </div>
              <h3 className="text-2xl font-medium text-night-text">UnoWork</h3>
              <p className="font-serif text-[17px] leading-relaxed text-night-muted">
                Рабочее пространство в браузере. Открываете ссылку из кабинета, входите по выданным данным — и перед вами
                серверная среда с Hermes. Устанавливать ничего не нужно.
              </p>
              <p className="mt-auto text-sm text-night-muted">Подходит, если хочется начать за пару минут.</p>
            </article>
          </Reveal>
          <Reveal delay={80}>
            <article className="flex h-full flex-col gap-5 rounded-2xl bg-night-2 p-7 sm:p-8">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg border border-night-line px-4 py-2.5 font-mono text-[13px]">
                <dt className="text-night-muted">сервер</dt>
                <dd className="truncate text-night-text">hm-w-0142.bb.demo</dd>
                <dt className="text-night-muted">ключ</dt>
                <dd className="text-night-text">bb_demo_••••••••</dd>
              </dl>
              <h3 className="text-2xl font-medium text-night-text">BB</h3>
              <p className="font-serif text-[17px] leading-relaxed text-night-muted">
                Вход в ту же серверную среду через BB. Адрес сервера, имя пользователя и ключ доступа — в кабинете,
                вместе с пошаговой инструкцией.
              </p>
              <p className="mt-auto text-sm text-night-muted">Подходит, если вы уже работаете в BB.</p>
            </article>
          </Reveal>
        </div>
        <p className="mt-6 font-serif text-lg text-night-muted">
          <span className="text-night-text">Оба способа входят в любой тариф</span> и не исключают друг друга: выбирать при
          покупке не нужно, переключаться можно когда угодно.
        </p>

        <Reveal className="mt-16 grid gap-6 border-t border-night-line pt-10 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <h3 className="text-2xl leading-snug font-medium text-night-text">
            Запустить Hermes на своём компьютере с этим аккаунтом нельзя
          </h3>
          <p className="font-serif text-lg leading-relaxed text-night-muted">
            Аккаунт не выдаётся для локального использования: доступы работают только внутри серверной среды Hermes. Если
            вам нужен именно локальный запуск на своём ноутбуке, сервис не подойдёт — лучше узнать это до оплаты. При
            покупке мы попросим это подтвердить.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function RulesSection() {
  const steps: [string, string, string[]][] = [
    ["Сообщите в кабинете", "На карточке заблокированного аккаунта появится кнопка «Сообщить о блокировке».", ICON_BUBBLE],
    ["Команда проверит логи", "Мы смотрим логи использования аккаунта и сверяем их с правилами.", ICON_LENS],
    ["Решение", "Правила не нарушались — выдаём замену того же тарифа. Нарушались — замены не будет.", ICON_CHECK],
  ];
  return (
    <section id="rules" aria-labelledby="rules-title" className="py-20">
      <SectionTitle
        id="rules-title"
        title="Если аккаунт заблокируют"
        lead="Мы не обещаем, что блокировок не будет: подготовленная среда снижает риск, но исключить его полностью нельзя. Зато порядок действий известен заранее."
      />
      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ol className="flex flex-col">
          {steps.map(([t, d, icon]) => (
            <li key={t} className="grid grid-cols-[48px_1fr] gap-x-6 border-t border-line py-7 first:border-t-0 first:pt-0">
              <div className="flex justify-center pt-1">
                <PixelArt art={icon} palette={LIGHT} className="h-8 w-auto" />
              </div>
              <div>
                <p className="text-lg font-medium">{t}</p>
                <p className="mt-1 font-serif text-[17px] leading-relaxed text-ink/75">{d}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="rounded-2xl bg-sand p-7 sm:p-9">
          <h3 className="text-xl font-medium">Что запрещено</h3>
          <ul className="mt-5 flex flex-col gap-4 font-serif text-[17px] leading-relaxed text-ink/85">
            <li><span className="font-sans font-medium">Дистилляция моделей</span> — массовая выгрузка ответов модели, чтобы обучить на них другую модель.</li>
            <li><span className="font-sans font-medium">Кибератаки</span> — взлом, поиск уязвимостей в чужих системах без разрешения владельца, создание вредоносного кода.</li>
            <li><span className="font-sans font-medium">Передача доступа</span> другим людям и попытки вынести аккаунт из серверной среды.</li>
          </ul>
          <Link href="/rules" className="mt-7 inline-flex items-center gap-1.5 font-medium text-brand-strong hover:text-brand">
            Все правила использования <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function ReviewsSection() {
  const reviews = [
    {
      text: "Я продакт, код пишу редко. Главное — не пришлось разбираться с оплатой аккаунта: открыла ссылку из кабинета и через десять минут уже собирала прототип.",
      who: "Полина, продакт-менеджер",
    },
    {
      text: "Сначала расстроился, что нельзя запустить у себя. Потом оценил: среда одна и та же, захожу хоть с рабочего ноутбука, хоть с домашнего.",
      who: "Артём, фронтенд-разработчик",
    },
    {
      text: "Брала «Рабочий» под конкретный проект. Продлила в кабинете за минуту, аккаунт остался тот же — ничего не пришлось настраивать заново.",
      who: "Саша, дизайнер, делает свои сервисы",
    },
  ];
  return (
    <section id="reviews" aria-labelledby="reviews-title" className="py-20">
      <SectionTitle
        id="reviews-title"
        title="Что могли бы рассказать клиенты"
        lead="Это демонстрационные отзывы: они написаны для прототипа, авторы вымышлены."
      />
      <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
        {reviews.map((r, i) => (
          <Reveal key={r.who} delay={i * 70}>
            <figure className="flex h-full flex-col gap-5 border-t border-ink pt-6">
              <blockquote className="font-serif text-xl leading-relaxed">«{r.text}»</blockquote>
              <figcaption className="mt-auto text-sm text-muted">{r.who} · демо-отзыв</figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function FaqSection() {
  const faq: [string, string][] = [
    ["Можно ли запустить Hermes на своём компьютере с этим аккаунтом?", "Нет. Аккаунт работает только на сервере Hermes. Вы подключаетесь к нему через UnoWork или BB, а для локального запуска аккаунт и его доступы не выдаются."],
    ["Нужно ли выбирать между UnoWork и BB?", "Нет, в любой тариф входят оба способа. Можно начать с одного и в любой момент переключиться на другой."],
    ["Когда начинается оплаченный месяц?", "В момент первой оплаты. Дата окончания и количество оставшихся дней всегда видны в личном кабинете."],
    ["Как продлить?", "В личном кабинете, кнопкой «Продлить». Продление — отдельная оплата, аккаунт остаётся прежним."],
    ["Что будет, если не продлить вовремя?", "Работа в аккаунте приостановится, но какое-то время он останется закреплённым за вами — продлить можно и в этот период. Точный срок хранения пока уточняется."],
    ["Что делать, если свободных аккаунтов нет?", "Оставьте заявку на нужный тариф. Администратор свяжется с вами сам. Заявка не требует оплаты и ни к чему не обязывает."],
    ["Гарантируете, что аккаунт не заблокируют?", "Нет. Работа в подготовленной серверной среде снижает риск, но не исключает его. Если блокировка случилась, команда проверит логи: без нарушения правил аккаунт заменят, при нарушении — замены не будет."],
  ];
  return (
    <section id="faq" aria-labelledby="faq-title" className="grid gap-10 py-20 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
      <SectionTitle id="faq-title" title="Вопросы" className="lg:self-start" />
      <div className="border-t border-line">
        {faq.map(([q, a]) => (
          <details key={q} className="group border-b border-line">
            <summary className="flex cursor-pointer items-center justify-between gap-6 py-5 text-lg font-medium transition-colors hover:text-brand-strong">
              {q}
              <span aria-hidden className="relative size-3.5 shrink-0">
                <span className="absolute top-1/2 left-0 h-[1.5px] w-3.5 -translate-y-1/2 bg-current" />
                <span className="absolute top-0 left-1/2 h-3.5 w-[1.5px] -translate-x-1/2 bg-current transition-transform duration-200 group-open:rotate-90 group-open:opacity-0" />
              </span>
            </summary>
            <p className="max-w-2xl pb-6 font-serif text-[17px] leading-relaxed text-ink/80">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
