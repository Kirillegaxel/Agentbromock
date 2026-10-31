"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Palette = Record<string, string>;

/** Символы, которые мигают (огоньки сервера). */
const BLINK = new Set(["L"]);

/**
 * Пиксельная иллюстрация из строк-битмапов. Пиксели «собираются» при появлении на экране;
 * при настройке «уменьшить движение» картинка показывается сразу.
 */
export function PixelArt({
  art,
  palette,
  title,
  className,
  children,
}: {
  art: string[];
  palette: Palette;
  title?: string;
  className?: string;
  /** Дополнительные элементы внутри svg (например, движущиеся пакеты). */
  children?: ReactNode;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const width = Math.max(...art.map((r) => r.length));
  const height = art.length;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = () => el.setAttribute("data-on", "true");
    if (!("IntersectionObserver" in window)) return void on();
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        on();
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Соседние пиксели одного цвета в строке рисуются одним прямоугольником — без швов между ними.
  const rects: ReactNode[] = [];
  art.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      if (!BLINK.has(ch)) while (end < row.length && row[end] === ch) end++;
      const fill = palette[ch];
      if (fill) {
        const delay = ((x * 7 + y * 13) % 23) * 22 + y * 10;
        rects.push(
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={end - x + 0.04}
            height={1.04}
            fill={fill}
            className={BLINK.has(ch) ? "px-blink" : undefined}
            style={{ "--d": `${delay}ms`, "--b": `${((x * 3 + y * 5) % 7) * 300}ms` } as CSSProperties}
          />,
        );
      }
      x = end;
    }
  });

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn("px-art", className)}
    >
      {rects}
      {children}
    </svg>
  );
}
