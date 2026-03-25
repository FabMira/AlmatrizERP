"use client";

import { useDroppable } from "@dnd-kit/core";

interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
}

export default function DroppableColumn({ id, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`space-y-3 flex-1 min-h-[80px] rounded-xl p-1 -m-1 transition-all duration-200 ${
        isOver
          ? "ring-2 ring-inset ring-[var(--color-primary)] bg-[var(--color-primary)]/5"
          : ""
      }`}
    >
      {children}
    </div>
  );
}
