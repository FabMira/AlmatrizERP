"use client";

import { useState } from "react";
import { Button, Chip, Avatar, AvatarFallback } from "@heroui/react";
import { Icon } from "@iconify/react";

const priorities = [
  { label: "Todos", value: "all" },
  { label: "Alta", value: "alta" },
  { label: "Media", value: "media" },
  { label: "Baja", value: "baja" },
];

const priorityColors = {
  alta: { bg: "var(--color-error-container)", text: "var(--color-error)", dot: "#ba1a1a" },
  media: { bg: "var(--color-tertiary-container)", text: "var(--color-tertiary)", dot: "#8c5000" },
  baja: { bg: "var(--color-primary-container)", text: "var(--color-primary)", dot: "#00687a" },
};

type Priority = "alta" | "media" | "baja";

interface Task {
  id: number;
  title: string;
  category: string;
  priority: Priority;
  assignee: string;
  initials: string;
  dueDate: string;
  completed?: boolean;
}

const columnBorders = ["var(--color-outline-variant)", "var(--color-tertiary)", "var(--color-primary)"];
const columnHeaderColors = [
  "text-[var(--color-on-surface-variant)]",
  "text-[var(--color-tertiary)]",
  "text-[var(--color-primary)]",
];

export default function TareasPage() {
  const [activePriority, setActivePriority] = useState("all");
  const [columns] = useState<{ column: string; items: Task[] }[]>([
    { column: "Pendiente", items: [] },
    { column: "En Progreso", items: [] },
    { column: "Completada", items: [] },
  ]);

  const filterTasks = (items: Task[]) =>
    activePriority === "all" ? items : items.filter((t) => t.priority === activePriority);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Native select */}
        <select
          className="h-9 px-3 rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-48"
          defaultValue=""
        >
          <option value="" disabled>Todas las áreas</option>
          <option value="academica">Área Académica</option>
          <option value="admin">Administración</option>
          <option value="marketing">Gestión y Marketing</option>
          <option value="servicios">Servicios</option>
        </select>
        <div className="flex gap-2 flex-wrap">
          {priorities.map((p) => (
            <button
              key={p.value}
              onClick={() => setActivePriority(p.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                activePriority === p.value
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                  : "border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="sm:ml-auto">
          <Button
            className="bg-[var(--color-primary)] text-white"
          >
            <Icon icon="material-symbols:add" className="text-lg" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="kanban-scroll flex lg:grid lg:grid-cols-3 gap-4">
        {columns.map((col, ci) => {
          const filtered = filterTasks(col.items);
          return (
            <div
              key={col.column}
              className="kanban-column flex flex-col rounded-2xl bg-[var(--color-surface-container-low)] p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: columnBorders[ci] }}
                  />
                  <span className={`font-bold text-sm ${columnHeaderColors[ci]}`}>
                    {col.column}
                  </span>
                </div>
                <span className="bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] text-xs font-semibold rounded-full px-2 py-0.5">
                  {filtered.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {filtered.map((task) => {
                  const pc = priorityColors[task.priority];
                  return (
                    <div
                      key={task.id}
                      className={`rounded-xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] p-4 ${task.completed ? "opacity-70" : ""}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Chip size="sm" className="h-5 text-[10px] text-[var(--color-on-surface-variant)]">
                          {task.category}
                        </Chip>
                        <span
                          className="ml-auto w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: pc.dot }}
                          title={task.priority}
                        />
                      </div>
                      <p className={`text-sm font-semibold text-[var(--color-on-surface)] leading-snug ${task.completed ? "line-through opacity-60" : ""}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1.5">
                          <Avatar
                            size="sm"
                            className="w-6 h-6 bg-[var(--color-secondary-container)]"
                          >
                            <AvatarFallback className="text-[10px] text-[var(--color-on-secondary-container)]">{task.initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-[var(--color-on-surface-variant)]">{task.assignee}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[var(--color-outline)]">
                          <Icon icon="material-symbols:calendar-today-outline" className="text-xs" />
                          <span className="text-xs">{task.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className="mt-3 flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors py-2">
                <Icon icon="material-symbols:add-circle-outline" className="text-base" />
                Agregar tarea
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
