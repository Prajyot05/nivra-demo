"use client";

import { Download, Loader2 } from "lucide-react";
import { ICON_BUTTON } from "@nivra/ui";

/**
 * Header action shared by every calculator. Each page used to re-declare the
 * same icon button with its own inline token overrides.
 */
export function ReportDownloadButton({
  onClick,
  disabled,
  loading = false,
  title: titleOverride,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Shown when set; otherwise defaults from loading state. */
  title?: string;
}) {
  const title =
    titleOverride ?? (loading ? "Preparing PDF…" : "Download report");
  const ariaLabel = loading ? "Preparing PDF" : title;

  return (
    <button
      type="button"
      className={ICON_BUTTON}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      aria-label={ariaLabel}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
    </button>
  );
}
