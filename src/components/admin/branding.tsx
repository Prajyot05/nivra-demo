import { cn } from "@/lib/utils";

export function NivraMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--admin-brand,#0b7443)] text-[11px] font-bold tracking-tight text-white"
      >
        N
      </span>
      <span className="text-[14px] font-semibold tracking-tight text-[var(--admin-ink,#0a0a0a)]">
        Nivra
      </span>
    </div>
  );
}

export function PoweredByNivra({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "text-center text-[10px] text-[var(--admin-faint,#a3a3a3)]",
        className,
      )}
    >
      Powered by <span className="font-medium text-[var(--admin-muted,#737373)]">Nivra</span>
    </p>
  );
}
