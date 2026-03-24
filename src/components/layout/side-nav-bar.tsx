"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Avatar, AvatarFallback } from "@heroui/react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { label: "Calendario", icon: "material-symbols:calendar-today-outline", href: "/calendario" },
  { label: "Tareas", icon: "material-symbols:assignment-outline", href: "/tareas" },
  { label: "Portafolio Alumnas", icon: "material-symbols:school-outline", href: "/portafolio-alumnas" },
  { label: "Portafolio Docentes", icon: "material-symbols:menu-book-outline", href: "/portafolio-docentes" },
  { label: "Links Importantes", icon: "material-symbols:link-outline", href: "/links" },
  { label: "Administración", icon: "material-symbols:settings-outline", href: "/administracion" },
];

interface SideNavBarProps {
  activePath: string;
}

export default function SideNavBar({ activePath }: SideNavBarProps) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const initials = email ? email.slice(0, 2).toUpperCase() : "?";
  const displayName = email ? email.split("@")[0] : "Cargando...";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex flex-col h-full bg-[#0F172A]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-700/50">
        <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          A
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">AlmatrizERP</p>
          <p className="text-slate-400 text-xs">Panel Administrativo</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            activePath === item.href || activePath.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "text-cyan-400 bg-cyan-500/10 border-r-4 border-cyan-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Icon icon={item.icon} className="text-lg flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div ref={profileRef} className="relative px-4 py-4 border-t border-slate-700/50">
        {/* Profile popover */}
        {profileOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-xl bg-[#1E293B] border border-slate-700/60 shadow-2xl shadow-black/50 overflow-hidden">
            {/* User info header */}
            <div className="px-4 py-4 bg-gradient-to-br from-cyan-500/10 to-transparent border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{displayName}</p>
                  <p className="text-slate-400 text-xs truncate">{email ?? "..."}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={() => { setProfileOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors text-left"
              >
                <Icon icon="material-symbols:manage-accounts-outline" className="text-lg text-slate-400" />
                <span>Mi Perfil</span>
              </button>
              <button
                onClick={() => { setProfileOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
              >
                <Icon icon="material-symbols:logout-outline" className="text-lg" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}

        {/* Clickable user row */}
        <button
          onClick={() => setProfileOpen((v) => !v)}
          className={`w-full flex items-center gap-3 rounded-lg px-2 py-2 transition-colors cursor-pointer ${
            profileOpen ? "bg-slate-700/50" : "hover:bg-slate-800/50"
          }`}
        >
          <Avatar size="sm" className="bg-cyan-500 text-white flex-shrink-0">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-white text-sm font-medium truncate">{displayName}</p>
            <p className="text-slate-500 text-xs truncate">{email ?? "Cargando..."}</p>
          </div>
          <Icon
            icon="material-symbols:expand-less"
            className={`text-slate-400 text-lg flex-shrink-0 transition-transform ${profileOpen ? "rotate-0" : "rotate-180"}`}
          />
        </button>
      </div>
    </div>
  );
}
