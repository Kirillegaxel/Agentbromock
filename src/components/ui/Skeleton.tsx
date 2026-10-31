import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-ink/8 motion-reduce:animate-none", className)} />;
}

export function PageLoading({ label = "Загружаем…" }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col gap-4 py-10">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
