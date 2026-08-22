"use client";

import { Menu } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";

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

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed, hydrated]);

  const collapse = useCallback(() => {
    setCollapsed(true);
    setOverlayOpen(false);
  }, []);

  const expand = useCallback(() => {
    setCollapsed(false);
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

/** Shown to the left of page titles when the sidebar is collapsed (desktop). */
export function NavToggleButton() {
  const { collapsed, hydrated, openOverlay } = useSidebar();

  if (!hydrated || !collapsed) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      className="mt-0.5 hidden size-8 shrink-0 shadow-sm md:inline-flex"
      onClick={openOverlay}
      aria-label="Open navigation"
    >
      <Menu className="size-4" />
    </Button>
  );
}
