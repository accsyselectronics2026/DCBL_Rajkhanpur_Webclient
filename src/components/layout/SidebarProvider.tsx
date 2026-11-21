"use client";

import { createContext, useContext, useState } from "react";

type Ctx = {
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
};

const SidebarCtx = createContext<Ctx | null>(null);

export function useSidebar() {
  const c = useContext(SidebarCtx);
  if (!c) throw new Error("useSidebar must be used inside SidebarProvider");
  return c;
}

export default function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <SidebarCtx.Provider
      value={{ collapsed, toggleCollapsed: () => setCollapsed((c) => !c), mobileOpen, setMobileOpen }}
    >
      {children}
    </SidebarCtx.Provider>
  );
}