"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";

const bottomItems = [
  { label: "Inicio", icon: "material-symbols:home-outline", href: "/" },
  { label: "Tareas", icon: "material-symbols:assignment-outline", href: "/tareas" },
  { label: "Alumnas", icon: "material-symbols:school-outline", href: "/portafolio-alumnas" },
  { label: "Admin", icon: "material-symbols:settings-outline", href: "/administracion" },
  { label: "Más", icon: "material-symbols:more-horiz-outline", href: "#" },
];

interface BottomNavBarProps {
  activePath: string;
}

export default function BottomNavBar({ activePath }: BottomNavBarProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/90 backdrop-blur-md border-t border-[var(--color-outline-variant)] rounded-t-2xl">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {bottomItems.map((item) => {
          const isActive =
            item.href !== "#" &&
            (activePath === item.href || activePath.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl min-w-[3rem] transition-all ${
                isActive
                  ? "text-cyan-600 bg-cyan-50"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon icon={item.icon} className="text-xl" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
