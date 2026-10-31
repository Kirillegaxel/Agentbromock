/**
 * Пиксельные спрайты Hermes. Сквозной мотив — сервер, на котором живёт аккаунт.
 * k — контур, w — заливка, s — детали, o — акцент, L — мигающий огонёк.
 */
import type { Palette } from "./PixelArt";

export const RACK = [
  "kkkkkkkkkkkkkkkkkkkk",
  "kwwwwwwwwwwwwwwwwwwk",
  "kwLwowwskskskskswwwk",
  "kwwwwwwwwwwwwwwwwwwk",
  "kkkkkkkkkkkkkkkkkkkk",
  "kwwwwwwwwwwwwwwwwwwk",
  "kwowLwwskskskskswwwk",
  "kwwwwwwwwwwwwwwwwwwk",
  "kkkkkkkkkkkkkkkkkkkk",
  "kwwwwwwwwwwwwwwwwwwk",
  "kwLwLwwskskskskswwwk",
  "kwwwwwwwwwwwwwwwwwwk",
  "kkkkkkkkkkkkkkkkkkkk",
  "kwwwwwwwwwwwwwwwwwwk",
  "kwowwwwskskskskswwwk",
  "kwwwwwwwwwwwwwwwwwwk",
  "kkkkkkkkkkkkkkkkkkkk",
  ".kk..............kk.",
];

export const SMALL_RACK = [
  "kkkkkkkkkkkkkk",
  "kwwwwwwwwwwwwk",
  "kwLwLwskskskwk",
  "kwwwwwwwwwwwwk",
  "kkkkkkkkkkkkkk",
  "kwwwwwwwwwwwwk",
  "kwowLwskskskwk",
  "kwwwwwwwwwwwwk",
  "kkkkkkkkkkkkkk",
  ".kk........kk.",
];

export const LAPTOP = [
  "..kkkkkkkkkkkk..",
  "..kwwwwwwwwwwk..",
  "..kwosswwwwwwk..",
  "..kwwwwwwwwwwk..",
  "..kwssssswwwwk..",
  "..kwwwwwwwwwwk..",
  "..kkkkkkkkkkkk..",
  "kkkkkkkkkkkkkkkk",
  ".kkkkkkkkkkkkkk.",
];

export const PHONE = [
  "kkkkkkk",
  "kwwwwwk",
  "kwosswk",
  "kwwwwwk",
  "kwssswk",
  "kwwwwwk",
  "kwwwwwk",
  "kkkkkkk",
  "kkkokkk",
  "kkkkkkk",
];

export const ICON_CARD = [
  "kkkkkkkkkkkk",
  "kwwwwwwwwwwk",
  "kkkkkkkkkkkk",
  "kwwwwwwwwwwk",
  "kwoowwwwwwwk",
  "kwoowwwssswk",
  "kwwwwwwwwwwk",
  "kkkkkkkkkkkk",
];

export const ICON_LOCK = [
  "...kkkk...",
  "..k....k..",
  "..k....k..",
  "..k....k..",
  "kkkkkkkkkk",
  "kooooooook",
  "koookkoook",
  "koookkoook",
  "kooooooook",
  "kkkkkkkkkk",
];

export const ICON_BOLT = [
  "....oooo",
  "...oooo.",
  "..oooo..",
  ".oooo...",
  "oooooooo",
  "...oooo.",
  "..oooo..",
  ".oooo...",
  ".ooo....",
  ".oo.....",
];

export const ICON_SHIELD = [
  "kkkkkkkkkk",
  "kooooooook",
  "koooooowok",
  "kooooowook",
  "kowoowoook",
  ".kowwoook.",
  ".kooooook.",
  "..kooook..",
  "...kook...",
  "....kk....",
];

export const ICON_BUBBLE = [
  "kkkkkkkkkk",
  "kwwwwowwwk",
  "kwwwwowwwk",
  "kwwwwwwwwk",
  "kwwwwowwwk",
  "kkkkkkkkkk",
  "..kk......",
  "..k.......",
];

export const ICON_LENS = [
  ".kkkk.....",
  "kwwwwk....",
  "kwsswk....",
  "kwwwwk....",
  ".kkkko....",
  ".....oo...",
  "......oo..",
  ".......oo.",
];

export const ICON_CHECK = [
  "........oo",
  ".......oo.",
  "......oo..",
  "oo...oo...",
  ".oo.oo....",
  "..ooo.....",
  "...o......",
];

const UNIT_TOP = "kkkkkkkkkkkk";
const UNIT = ["kwwwwwwwwwwk", "kwLwowskskwk", "kwwwwwwwwwwk"];

/** Сервер из 1–3 блоков — мощность тарифа. Высота всегда одинаковая. */
export function planRack(units: number): string[] {
  const rows: string[] = [UNIT_TOP];
  for (let i = 0; i < units; i++) rows.push(...UNIT, UNIT_TOP);
  while (rows.length < 13) rows.unshift("............");
  return rows;
}

const MONITOR = ["kkkkkkk", "kwwwwwk", "kwoswwk", "kwwwwwk", "kkkkkkk", "..kkk.."];
export const TEAM = MONITOR.map((r) => `${r}..${r}..${r}`);

export const LIGHT: Palette = {
  k: "var(--color-ink)",
  w: "var(--color-card)",
  s: "var(--color-line-strong)",
  o: "var(--color-brand)",
  L: "var(--color-brand)",
};

export const DARK: Palette = {
  k: "var(--color-night-text)",
  w: "var(--color-night-2)",
  s: "var(--color-night-line)",
  o: "#e7a58b",
  L: "#e7a58b",
};

export const ON_BRAND: Palette = {
  k: "#fbf6f0",
  s: "#e9b9a3",
  o: "var(--color-ink)",
  L: "var(--color-ink)",
};

/** Собирает картинку из нескольких битмапов на общем холсте. */
export function compose(width: number, height: number, parts: Array<{ art: string[]; x: number; y: number }>): string[] {
  const grid = Array.from({ length: height }, () => Array<string>(width).fill("."));
  for (const { art, x, y } of parts)
    art.forEach((row, dy) =>
      [...row].forEach((ch, dx) => {
        if (ch !== "." && grid[y + dy]?.[x + dx] !== undefined) grid[y + dy][x + dx] = ch;
      }),
    );
  return grid.map((r) => r.join(""));
}
