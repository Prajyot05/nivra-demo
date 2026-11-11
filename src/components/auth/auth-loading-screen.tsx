import { NivraMark } from "@/components/admin/branding";

export type AuthLoadingPhase = "checking" | "redirecting";

export function AuthLoadingScreen({ phase }: { phase: AuthLoadingPhase }) {
  const message =
    phase === "checking" ? "Checking your session…" : "Taking you to your workspace…";

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center bg-white px-5 text-[#0a0a0a]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <NivraMark />
      <div className="mt-10 flex flex-col items-center gap-4">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-[#e5e5e5] border-t-[#0b7443]"
          aria-hidden
        />
        <p className="text-[14px] text-[#737373]">{message}</p>
      </div>
    </div>
  );
}
