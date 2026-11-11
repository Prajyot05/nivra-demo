"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, Loader2 } from "lucide-react";
import { ICON_BUTTON } from "@nivra/ui";
import type { SipDossierStyleOption } from "@/components/v2/reports/sip-styles";
import { cn } from "@/lib/utils";

/**
 * Download control that opens a theme menu before generating the PDF.
 */
export function ReportStyleDownloadButton({
  styles,
  onDownload,
  disabled,
  loading = false,
}: {
  styles: SipDossierStyleOption[];
  onDownload: (styleId: SipDossierStyleOption["id"]) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (loading) setOpen(false);
  }, [loading]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={cn(ICON_BUTTON, "gap-0.5 px-2")}
        onClick={() => {
          if (disabled || loading) return;
          setOpen((v) => !v);
        }}
        disabled={disabled || loading}
        title={loading ? "Preparing PDF…" : "Download report"}
        aria-label={loading ? "Preparing PDF" : "Download report"}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <Download className="size-4" />
            <ChevronDown className="size-3 opacity-70" />
          </>
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-[280px] overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg"
        >
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Report theme
          </p>
          {styles.map((style) => (
            <button
              key={style.id}
              type="button"
              role="menuitem"
              className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-slate-50"
              onClick={() => {
                setOpen(false);
                onDownload(style.id);
              }}
            >
              <span className="text-[13px] font-medium text-slate-900">{style.name}</span>
              <span className="text-[11px] leading-snug text-slate-500">{style.description}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
