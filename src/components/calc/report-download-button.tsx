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
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      className={ICON_BUTTON}
      onClick={onClick}
      disabled={disabled || loading}
      title={loading ? "Preparing PDF…" : "Download report"}
      aria-label={loading ? "Preparing PDF" : "Download report"}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
    </button>
  );
}
