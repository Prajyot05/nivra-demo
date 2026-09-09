"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ADMIN_LAYOUT_STORAGE_KEY,
  ADMIN_LAYOUTS,
  DEFAULT_ADMIN_LAYOUT,
  getAdminLayout,
  resolveAdminLayoutId,
  type AdminLayoutId,
  type AdminLayoutPreset,
} from "@/lib/admin/layouts";

type AdminLayoutContextValue = {
  layoutId: AdminLayoutId;
  layout: AdminLayoutPreset;
  layouts: AdminLayoutPreset[];
  setLayoutId: (id: AdminLayoutId) => void;
  hydrated: boolean;
};

const AdminLayoutContext = createContext<AdminLayoutContextValue | null>(null);

export function AdminLayoutProvider({ children }: { children: ReactNode }) {
  const [layoutId, setLayoutIdState] = useState<AdminLayoutId>(DEFAULT_ADMIN_LAYOUT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_LAYOUT_STORAGE_KEY);
    const resolved = resolveAdminLayoutId(stored);
    setLayoutIdState(resolved);
    if (stored !== resolved) {
      localStorage.setItem(ADMIN_LAYOUT_STORAGE_KEY, resolved);
    }
    setHydrated(true);
  }, []);

  const setLayoutId = useCallback((id: AdminLayoutId) => {
    setLayoutIdState(id);
    localStorage.setItem(ADMIN_LAYOUT_STORAGE_KEY, id);
  }, []);

  const value = useMemo(
    () => ({
      layoutId,
      layout: getAdminLayout(layoutId),
      layouts: ADMIN_LAYOUTS,
      setLayoutId,
      hydrated,
    }),
    [layoutId, setLayoutId, hydrated],
  );

  return (
    <AdminLayoutContext.Provider value={value}>{children}</AdminLayoutContext.Provider>
  );
}

export function useAdminLayout() {
  const ctx = useContext(AdminLayoutContext);
  if (!ctx) {
    throw new Error("useAdminLayout must be used within AdminLayoutProvider");
  }
  return ctx;
}
