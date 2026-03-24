"use client";

import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

interface FABProps {
  onClick?: () => void;
  label?: string;
}

export default function FAB({ onClick, label = "Nuevo" }: FABProps) {
  return (
    <Button
      isIconOnly
      onPress={onClick}
      aria-label={label}
      className="fixed right-6 bottom-24 lg:bottom-8 lg:right-8 z-30 w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white shadow-lg hover:scale-110 active:scale-95 transition-transform min-w-0"
    >
      <Icon icon="material-symbols:add" className="text-2xl" />
    </Button>
  );
}
