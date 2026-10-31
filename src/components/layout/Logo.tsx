import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ href = "/", suffix, light }: { href?: string; suffix?: string; light?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-baseline gap-2 rounded-sm" aria-label="Hermes — на главную">
      <span className={cn("text-[21px] font-semibold tracking-[-0.03em]", light && "text-night-text")}>hermes</span>
      {suffix && <span className="text-sm text-muted">{suffix}</span>}
    </Link>
  );
}
