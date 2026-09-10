"use client";

import { Menu } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "nivra-sidebar-collapsed";

type SidebarContextValue = {
  collapsed: boolean;
  hydrated: boolean;
  overlayOpen: boolean;
  collapse: () => void;
  expand: () => void;
  openOverlay: () => void;
  closeOverlay: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

function subscribeCollapsed(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("nivra-sidebar-collapsed", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("nivra-sidebar-collapsed", onStoreChange);
  };
}

function getCollapsedSnapshot(): boolean {
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

/** Must match SSR — never read localStorage during hydration. */
function getCollapsedServerSnapshot(): boolean {
  return false;
}

function setCollapsedPreference(collapsed: boolean) {
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  window.dispatchEvent(new Event("nivra-sidebar-collapsed"));
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [overlayOpen, setOverlayOpen] = useState(false);

  const collapse = useCallback(() => {
    setCollapsedPreference(true);
    setOverlayOpen(false);
  }, []);

  const expand = useCallback(() => {
    setCollapsedPreference(false);
    setOverlayOpen(false);
  }, []);

  const openOverlay = useCallback(() => setOverlayOpen(true), []);
  const closeOverlay = useCallback(() => setOverlayOpen(false), []);

  const value = useMemo(
    () => ({
      collapsed,
      hydrated,
      overlayOpen,
      collapse,
      expand,
      openOverlay,
      closeOverlay,
    }),
    [collapsed, hydrated, overlayOpen, collapse, expand, openOverlay, closeOverlay],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return ctx;
}

/**
 * Shown to the left of page titles when the sidebar is collapsed (desktop).
 * Always renders a stable wrapper so SSR / hydration markup matches.
 */
export function NavToggleButton() {
  const { collapsed, openOverlay } = useSidebar();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  const showToggle = ready && collapsed;

  return (
    <div
      className={cn(
        "mt-0.5 hidden shrink-0 md:block",
        showToggle ? "size-8" : "size-0 overflow-hidden",
      )}
      aria-hidden={!showToggle}
    >
      {showToggle ? (
        <Button
          variant="outline"
          size="icon"
          className="size-8 shadow-sm"
          onClick={openOverlay}
          aria-label="Open navigation"
        >
          <Menu className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
