"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import {
  ThemePicker,
  getColorTheme,
  readStoredColorTheme,
  writeStoredColorTheme,
  type ColorThemeId,
} from "@nivra/ui";
import { cn } from "@/lib/utils";
import { NivraMark, PoweredByNivra } from "@/components/admin/branding";
import { getV2Calculator, V2_PHASE1_CALCULATORS } from "./registry";
import { buildV2ThemeStyle, V2ThemeProvider } from "./theme";
import { V2NavLink } from "./ui";

function classicHrefForPath(pathname: string): string {
  const slug = pathname.startsWith("/2/") ? pathname.slice(3) : "";
  const meta = slug ? getV2Calculator(slug) : undefined;
  return meta?.classicHref ?? "/";
}

export function V2Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [themeId, setThemeId] = useState<ColorThemeId>("classic");
  const [themeReady, setThemeReady] = useState(false);
  const widthClass = isFullscreen
    ? "max-w-none w-full px-4 sm:px-6 lg:px-8"
    : "mx-auto max-w-[1400px] px-4 sm:px-6";
  const classicHref = classicHrefForPath(pathname);
  const theme = useMemo(() => getColorTheme(themeId), [themeId]);
  const themeStyle = useMemo(() => buildV2ThemeStyle(themeId), [themeId]);

  useEffect(() => {
    setThemeId(readStoredColorTheme());
    setThemeReady(true);
  }, []);

  const handleThemeChange = (id: ColorThemeId) => {
    setThemeId(id);
    writeStoredColorTheme(id);
  };

  const themeValue = useMemo(
    () => ({
      themeId,
      theme,
      chart: theme.chart,
      setThemeId: handleThemeChange,
    }),
    [themeId, theme],
  );

  return (
    <V2ThemeProvider value={themeValue}>
      <div
        className={cn(
          "v2-root flex min-h-dvh flex-col bg-[var(--v2-bg)] text-[var(--v2-ink)] transition-[background-color,color] duration-200",
          !themeReady && "opacity-0",
          themeReady && "opacity-100",
        )}
        style={themeStyle}
        data-v2-theme={themeId}
      >
        <header className="border-b border-[var(--v2-border)] bg-[var(--v2-surface)]">
          <div
            className={cn(
              "flex w-full flex-wrap items-center justify-between gap-3 py-3 transition-all duration-300",
              widthClass,
            )}
          >
            <div className="flex min-w-0 items-center gap-4">
              <Link href="/2" className="shrink-0">
                <NivraMark />
              </Link>
              <div className="hidden border-l border-[var(--v2-border)] pl-4 sm:block">
                <p className="text-[13px] font-semibold text-[var(--v2-ink)]">Advisory Suite</p>
                <p className="text-[12px] text-[var(--v2-muted)]">Professional planning tools</p>
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-2">
              <V2NavLink href="/2" active={pathname === "/2"}>
                Overview
              </V2NavLink>
              {V2_PHASE1_CALCULATORS.map((item) => (
                <V2NavLink
                  key={item.slug}
                  href={`/2/${item.slug}`}
                  active={pathname === `/2/${item.slug}`}
                >
                  {item.shortLabel}
                </V2NavLink>
              ))}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--v2-border)] bg-[var(--v2-bg)] px-2.5 text-xs font-medium text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-ink)]"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
                {isFullscreen ? "Default view" : "Full screen"}
              </button>
              <ThemePicker
                themeId={themeId}
                onThemeChange={handleThemeChange}
                buttonClassName="inline-flex h-9 min-w-[8.5rem] items-center justify-between gap-2 rounded-lg border border-[var(--v2-border)] bg-[var(--v2-surface)] px-2.5 text-xs font-medium text-[var(--v2-ink-soft)] shadow-sm transition hover:bg-[var(--v2-bg)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--v2-navy)]"
              />
              <Link
                href={classicHref}
                className="inline-flex h-9 items-center rounded-lg border border-[var(--v2-border)] bg-[var(--v2-surface)] px-2.5 text-xs font-medium text-[var(--v2-ink-soft)] transition-colors hover:bg-[var(--v2-navy-soft)]"
                title="Open the matching classic calculator"
              >
                Classic UI
              </Link>
            </nav>
          </div>
        </header>

        <main className={cn("w-full flex-1 py-5 sm:py-6 transition-all duration-300", widthClass)}>
          {children}
        </main>

        <footer className="border-t border-[var(--v2-border)] bg-[var(--v2-surface)]">
          <div
            className={cn(
              "flex w-full flex-wrap items-center justify-between gap-2 py-3 transition-all duration-300",
              widthClass,
            )}
          >
            <p className="text-[12px] text-[var(--v2-muted)]">
              Figures are illustrative. Actual market returns and tax rules may differ.
            </p>
            <PoweredByNivra />
          </div>
        </footer>
      </div>
    </V2ThemeProvider>
  );
}
