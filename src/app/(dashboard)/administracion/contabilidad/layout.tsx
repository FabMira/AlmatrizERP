"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { SECTIONS } from "@/domain/accounting/constants";

export default function ContabilidadLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const activeClass =
    "flex items-center gap-3 px-4 py-2.5 rounded-lg mx-2 bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed)] font-semibold border-l-2 border-[var(--color-primary)] transition-colors";
  const inactiveClass =
    "flex items-center gap-3 px-4 py-2.5 rounded-lg mx-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors";

  return (
    <div className="flex h-full min-h-[calc(100vh-64px)]">
      {/* Desktop sub-sidebar */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] flex-shrink-0">
        <Link
          href="/administracion"
          className="flex items-center gap-2 px-4 py-4 border-b border-[var(--color-outline-variant)] text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors"
        >
          <Icon icon="material-symbols:arrow-back" className="text-base" />
          <span className="font-semibold">Contabilidad 2026</span>
        </Link>
        <nav className="flex-1 overflow-y-auto py-2 space-y-0.5">
          {SECTIONS.map((s) => {
            const isActive = pathname === `/administracion/contabilidad/${s.slug}`;
            return (
              <Link
                key={s.slug}
                href={`/administracion/contabilidad/${s.slug}`}
                className={isActive ? activeClass : inactiveClass}
              >
                <Icon icon={s.icon} className="text-lg flex-shrink-0" />
                <span className="text-sm truncate">{s.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile: top pills row */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="lg:hidden border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]">
          <div className="flex items-center gap-2 px-3 pt-2 pb-1">
            <Link
              href="/administracion"
              className="flex items-center gap-1 text-xs text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] flex-shrink-0 py-1 px-1"
            >
              <Icon icon="material-symbols:arrow-back" className="text-sm" />
            </Link>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {SECTIONS.map((s) => {
                const isActive = pathname === `/administracion/contabilidad/${s.slug}`;
                return (
                  <Link
                    key={s.slug}
                    href={`/administracion/contabilidad/${s.slug}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-colors ${
                      isActive
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)]"
                    }`}
                  >
                    <Icon icon={s.icon} className="text-sm" />
                    <span>{s.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
