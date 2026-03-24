"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import SideNavBar from "./side-nav-bar";
import TopNavBar from "./top-nav-bar";
import BottomNavBar from "./bottom-nav-bar";
import FAB from "./fab";

const pageTitles: Record<string, string> = {
  "/": "Resumen General",
  "/calendario": "Calendario",
  "/tareas": "Tareas",
  "/portafolio-alumnas": "Portafolio Alumnas",
  "/portafolio-docentes": "Portafolio Docentes",
  "/links": "Links Importantes",
  "/administracion": "Administración",
};

interface AppShellProps {
  children: React.ReactNode;
  showFab?: boolean;
  onFabClick?: () => void;
}

export default function AppShell({
  children,
  showFab = true,
  onFabClick,
}: AppShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "AlmatrizERP";

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Mobile overlay backdrop */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — off-screen on mobile, always visible on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-300 ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <SideNavBar activePath={pathname} />
      </div>

      {/* Main content column */}
      <div className="lg:pl-60">
        <TopNavBar
          title={title}
          onMenuToggle={() => setIsMobileNavOpen((v) => !v)}
        />
        <main className="pb-24 lg:pb-8">{children}</main>
      </div>

      {/* Bottom nav (mobile only) */}
      <BottomNavBar activePath={pathname} />

      {/* Floating action button */}
      {showFab && <FAB onClick={onFabClick} />}
    </div>
  );
}
