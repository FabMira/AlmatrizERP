"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { STATUS_LABELS, STATUS_COLORS } from "@/domain/students/constants";
import type { Student, StudentStatus } from "@/domain/students/types";

interface StatusCellProps {
  student: Student;
  onUpdate: (id: string, status: StudentStatus) => void;
}

export default function StatusCell({ student, onUpdate }: StatusCellProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const sc = STATUS_COLORS[student.status];

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.closest("[data-status-cell]")?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 4, left: rect.left });
    setOpen((v) => !v);
  }

  return (
    <div data-status-cell="true" className="relative">
      <button
        ref={btnRef}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={handleOpen}
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-opacity hover:opacity-80 cursor-pointer"
        style={{ backgroundColor: sc.bg, color: sc.color }}
      >
        {STATUS_LABELS[student.status]}
        <Icon icon="material-symbols:arrow-drop-down" className="text-sm -mr-0.5" />
      </button>

      {open && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="fixed z-50 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] shadow-lg py-1 min-w-[130px]"
          style={{ top: coords.top, left: coords.left }}
        >
          {(Object.entries(STATUS_LABELS) as [StudentStatus, string][]).map(([val, label]) => {
            const c = STATUS_COLORS[val];
            return (
              <button
                key={val}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onUpdate(student.id, val);
                }}
                className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--color-surface-container-low)] transition-colors ${val === student.status ? "font-semibold" : ""}`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
