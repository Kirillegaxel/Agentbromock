import { PixelArt } from "../pixel/PixelArt";
import { compose, DARK, LAPTOP, PHONE, SMALL_RACK } from "../pixel/sprites";

const LINE_Y = 6;
const FROM = 27;
const TO = 45;
const line = Array.from({ length: TO - FROM }, (_, i) => (i % 2 === 0 ? "s" : ".")).join("");

const ART = compose(60, 12, [
  { art: LAPTOP, x: 0, y: 2 },
  { art: PHONE, x: 18, y: 1 },
  { art: [line], x: FROM, y: LINE_Y },
  { art: SMALL_RACK, x: 46, y: 1 },
]);

/** Схема: ваши устройства подключаются к серверу Hermes. Пакеты бегут по линии. */
export function ConnectDiagram({ className }: { className?: string }) {
  return (
    <figure className={className}>
      <PixelArt art={ART} palette={DARK} className="mx-auto w-[720px] max-w-full">
        {[0, 1, 2].map((i) => (
          <rect
            key={i}
            x={FROM}
            y={LINE_Y}
            width={1}
            height={1}
            fill="#e7a58b"
            className="px-packet"
            style={{ ["--dist" as string]: `${TO - FROM}px`, animationDelay: `${i * 0.87}s` }}
          />
        ))}
      </PixelArt>
      <figcaption className="mt-4 flex justify-between text-sm text-night-muted">
        <span>Ваш ноутбук или телефон</span>
        <span>Сервер Hermes с вашим аккаунтом</span>
      </figcaption>
    </figure>
  );
}
