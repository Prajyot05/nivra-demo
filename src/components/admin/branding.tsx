import { cn } from "@/lib/utils";

export function NivraMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[11px] font-bold tracking-tight text-primary-foreground"
      >
        N
      </span>
      <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
        Nivra
      </span>
    </div>
  );
}

export function PoweredByNivra({ className }: { className?: string }) {
  return (
    <p className={cn("text-center text-[11px] text-muted-foreground", className)}>
      Powered by <span className="font-medium text-foreground/80">Nivra</span>
    </p>
  );
}
