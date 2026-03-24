"use client";

import { Avatar, AvatarFallback, Button } from "@heroui/react";
import { Icon } from "@iconify/react";

interface TopNavBarProps {
  title: string;
  onMenuToggle: () => void;
}

export default function TopNavBar({ title, onMenuToggle }: TopNavBarProps) {
  return (
    <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-[var(--color-outline-variant)] flex items-center px-4 gap-3">
      {/* Mobile menu button */}
      <Button
        isIconOnly
        variant="ghost"
        onPress={onMenuToggle}
        className="lg:hidden text-[var(--color-on-surface)]"
        aria-label="Abrir menú"
      >
        <Icon icon="material-symbols:menu-outline" className="text-2xl" />
      </Button>

      {/* Page title */}
      <h1 className="font-bold text-[var(--color-on-surface)] text-xl flex-1 lg:flex-none min-w-0 truncate">
        {title}
      </h1>

      {/* Desktop spacer */}
      <div className="hidden lg:flex flex-1" />

      {/* Search */}
      <div className="hidden md:flex w-72">
        <div className="relative">
          <Icon icon="material-symbols:search-outline" className="absolute left-2.5 top-2 text-[var(--color-on-surface-variant)] text-lg pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar..."
            className="h-9 pl-9 pr-3 w-full rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* Notification bell with dot indicator */}
      <div className="relative">
        <Button
          isIconOnly
          variant="ghost"
          aria-label="Notificaciones"
          className="text-[var(--color-on-surface)]"
        >
          <Icon icon="material-symbols:notifications-outline" className="text-2xl" />
        </Button>
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full pointer-events-none" />
      </div>

      {/* User avatar */}
      <Avatar size="sm" className="bg-cyan-500 text-white cursor-pointer">
        <AvatarFallback>A</AvatarFallback>
      </Avatar>
    </header>
  );
}
