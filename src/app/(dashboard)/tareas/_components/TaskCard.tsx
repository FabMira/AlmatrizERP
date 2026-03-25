"use client";

import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/infrastructure/supabase/client";
import type { Task, TaskActivity, TaskStatus } from "@/domain/tasks/types";
import { PRIORITY_COLORS, STATUS_LABELS, STATUS_ORDER } from "@/domain/tasks/constants";

const PRIORITY_LABELS: Record<string, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

const STATUS_DOT_COLORS: Record<string, string> = {
  pendiente: "var(--color-outline)",
  en_progreso: "var(--color-tertiary)",
  completada: "var(--color-primary)",
};

interface TaskCardProps {
  task: Task;
  onMove: (taskId: string, direction: 1 | -1) => void;
  onDelete?: (taskId: string) => void;
  onReopen?: (taskId: string, note: string) => void;
  overlay?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  profilesMap?: Record<string, string>;
  activities?: TaskActivity[];
  activitiesLoading?: boolean;
  confirmingDelete?: boolean;
  onConfirmDelete?: () => void;
  onCancelDelete?: () => void;
  reopening?: boolean;
  reopenNote?: string;
  onStartReopen?: () => void;
  onCancelReopen?: () => void;
  onReopenNoteChange?: (note: string) => void;
  onConfirmReopen?: () => void;
}

/** Pure visual card — used both inside DraggableTaskCard and in DragOverlay */
export function TaskCardContent({
  task,
  onMove,
  overlay = false,
  isExpanded = false,
  onToggleExpand,
  profilesMap = {},
  activities = [],
  activitiesLoading = false,
  confirmingDelete = false,
  onConfirmDelete,
  onCancelDelete,
  reopening = false,
  reopenNote = "",
  onStartReopen,
  onCancelReopen,
  onReopenNoteChange,
  onConfirmReopen,
}: TaskCardProps) {
  const pc = PRIORITY_COLORS[task.priority];
  const currentIdx = STATUS_ORDER.indexOf(task.status);
  const assigneeName = task.assigned_to
    ? (profilesMap[task.assigned_to] ?? task.assigned_to.slice(0, 8) + "…")
    : null;

  const today = new Date().toISOString().split("T")[0];
  const isOverdue =
    task.due_date && task.status !== "completada" && task.due_date < today;

  return (
    <div
      onClick={!overlay ? onToggleExpand : undefined}
      className={`rounded-xl bg-[var(--color-surface-container-lowest)] border transition-all duration-200 select-none ${
        overlay
          ? "shadow-2xl border-[var(--color-outline-variant)]"
          : isExpanded
          ? "border-[var(--color-primary)] shadow-sm"
          : "border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]/50"
      } ${!overlay ? "cursor-pointer" : ""}`}
    >
      {/* ── Compact header (always visible) ─────────────────────── */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {task.areas && (
            <Chip size="sm" className="h-5 text-[10px] text-[var(--color-on-surface-variant)]">
              {task.areas.name}
            </Chip>
          )}
          <span
            className="ml-auto w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: pc.dot }}
            title={task.priority}
          />
          {!overlay && (
            <Icon
              icon={isExpanded ? "material-symbols:expand-less" : "material-symbols:expand-more"}
              className="text-base text-[var(--color-outline)] flex-shrink-0"
            />
          )}
          {!overlay && !confirmingDelete && !reopening && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onConfirmDelete?.();
              }}
              className="-mr-1 p-0.5 rounded text-[var(--color-outline)] hover:text-[var(--color-error)] transition-colors cursor-pointer"
              title="Eliminar tarea"
            >
              <Icon icon="material-symbols:close" className="text-sm" />
            </button>
          )}
        </div>

        <p
          className={`text-sm font-semibold text-[var(--color-on-surface)] leading-snug ${
            task.status === "completada" ? "line-through opacity-60" : ""
          }`}
        >
          {task.title}
        </p>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5">
            {assigneeName ? (
              <>
                <Avatar size="sm" className="w-6 h-6 bg-[var(--color-secondary-container)]">
                  <AvatarFallback className="text-[10px] text-[var(--color-on-secondary-container)]">
                    {assigneeName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-[var(--color-on-surface-variant)] truncate max-w-[90px]">
                  {assigneeName}
                </span>
              </>
            ) : (
              <span className="text-xs text-[var(--color-outline)]">Sin asignar</span>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            {task.due_date && (
              <div
                className={`flex items-center gap-1 mr-1 ${
                  isOverdue
                    ? "text-[var(--color-error)]"
                    : "text-[var(--color-outline)]"
                }`}
              >
                <Icon icon="material-symbols:calendar-today-outline" className="text-xs" />
                <span className="text-xs">
                  {new Date(task.due_date + "T00:00:00").toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            )}
            {!overlay && currentIdx > 0 && task.status !== "completada" && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onMove(task.id, -1); }}
                className="p-0.5 rounded text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors cursor-pointer"
                title="Mover atrás"
              >
                <Icon icon="material-symbols:chevron-left" className="text-base" />
              </button>
            )}
            {!overlay && task.status === "completada" && !reopening && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onStartReopen?.(); }}
                className="px-1.5 py-0.5 rounded text-xs font-medium text-[var(--color-tertiary)] hover:bg-[var(--color-tertiary-container)] transition-colors cursor-pointer"
                title="Reabrir tarea"
              >
                Reabrir
              </button>
            )}
            {!overlay && currentIdx < STATUS_ORDER.length - 1 && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onMove(task.id, 1); }}
                className="p-0.5 rounded text-[var(--color-outline)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                title="Mover adelante"
              >
                <Icon icon="material-symbols:chevron-right" className="text-base" />
              </button>
            )}
          </div>
        </div>

        {/* ── Inline delete confirmation ───────────────────────── */}
        {confirmingDelete && !overlay && (
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-[var(--color-error-container)] px-3 py-2"
          >
            <span className="text-xs font-medium text-[var(--color-error)]">
              ¿Eliminar esta tarea?
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onCancelDelete}
                className="px-2 py-0.5 rounded text-xs text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onConfirmDelete}
                className="px-2 py-0.5 rounded text-xs font-semibold bg-[var(--color-error)] text-white hover:opacity-90 transition-opacity cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}

        {/* ── Inline reopen panel ──────────────────────────────── */}
        {reopening && !overlay && (
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="mt-3 rounded-lg border border-[var(--color-tertiary)] bg-[var(--color-tertiary-container)]/30 p-3 space-y-2"
          >
            <p className="text-xs font-medium text-[var(--color-tertiary)]">
              Reabrir en &ldquo;En Progreso&rdquo;
            </p>
            <textarea
              value={reopenNote}
              onChange={(e) => onReopenNoteChange?.(e.target.value)}
              placeholder="Motivo de reapertura (opcional)…"
              rows={2}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-full text-xs resize-none rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-2 text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:ring-1 focus:ring-[var(--color-tertiary)]"
            />
            <div className="flex justify-end gap-1.5">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onCancelReopen}
                className="px-2 py-0.5 rounded text-xs text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onConfirmReopen}
                className="px-2 py-0.5 rounded text-xs font-semibold bg-[var(--color-tertiary)] text-white hover:opacity-90 transition-opacity cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Expanded detail panel ────────────────────────────────── */}
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: isExpanded && !overlay ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-0 border-t border-[var(--color-outline-variant)] mt-0">
            <div className="pt-3 space-y-3">
              {/* Description */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-outline)] mb-1">
                  Descripción
                </p>
                <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed">
                  {task.description?.trim() || (
                    <span className="italic text-[var(--color-outline)]">Sin descripción</span>
                  )}
                </p>
              </div>

              <div className="flex gap-4">
                {/* Priority */}
                <div className="flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-outline)] mb-1">
                    Prioridad
                  </p>
                  <span
                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: pc.bg, color: pc.text }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pc.dot }} />
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </div>

                {/* Due date */}
                {task.due_date && (
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-outline)] mb-1">
                      Fecha límite
                    </p>
                    <span
                      className={`text-xs font-medium ${
                        isOverdue ? "text-[var(--color-error)]" : "text-[var(--color-on-surface-variant)]"
                      }`}
                    >
                      {isOverdue && "⚠ "}
                      {new Date(task.due_date + "T00:00:00").toLocaleDateString("es-MX", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Assignee (full row with avatar) */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-outline)] mb-1">
                  Asignada a
                </p>
                {assigneeName ? (
                  <div className="flex items-center gap-2">
                    <Avatar size="sm" className="w-7 h-7 bg-[var(--color-secondary-container)]">
                      <AvatarFallback className="text-xs text-[var(--color-on-secondary-container)]">
                        {assigneeName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-[var(--color-on-surface)]">{assigneeName}</span>
                  </div>
                ) : (
                  <span className="text-xs italic text-[var(--color-outline)]">Sin asignar</span>
                )}
              </div>

              {/* Created at */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-outline)] mb-1">
                  Creada
                </p>
                <p className="text-xs text-[var(--color-on-surface-variant)]">
                  {new Date(task.created_at).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Activity history */}
              {(activitiesLoading || activities.length > 0) && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-outline)] mb-2 mt-1">
                    Historial
                  </p>
                  {activitiesLoading ? (
                    <div className="space-y-2.5">
                      {[0, 1].map((i) => (
                        <div key={i} className="flex gap-2.5 animate-pulse">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-outline-variant)] mt-1.5 flex-shrink-0" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-2.5 bg-[var(--color-outline-variant)] rounded w-3/4" />
                            <div className="h-2 bg-[var(--color-outline-variant)] rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="relative">
                      {activities.length > 1 && (
                        <div
                          className="absolute left-[2.5px] top-2 bottom-2 w-px bg-[var(--color-outline-variant)]"
                          aria-hidden
                        />
                      )}
                      <div className="space-y-3">
                        {activities.map((activity) => {
                          const statusKey = (activity.new_status ?? "") as TaskStatus;
                          const dotColor = STATUS_DOT_COLORS[statusKey] ?? "var(--color-outline)";
                          const label =
                            activity.event_type === "created"
                              ? `Creada en ${STATUS_LABELS[statusKey] ?? statusKey}`
                              : `Movida a ${STATUS_LABELS[statusKey] ?? statusKey}`;
                          return (
                            <div key={activity.id} className="flex gap-2.5 relative">
                              <div
                                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 relative z-10"
                                style={{ backgroundColor: dotColor }}
                              />
                              <div>
                                <p className="text-xs text-[var(--color-on-surface-variant)]">
                                  {label}
                                </p>
                                {activity.note && (
                                  <p className="text-[10px] italic text-[var(--color-on-surface-variant)] mt-0.5">
                                    &ldquo;{activity.note}&rdquo;
                                  </p>
                                )}
                                <p className="text-[10px] text-[var(--color-outline)]">
                                  {new Date(activity.created_at).toLocaleString("es-MX", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Draggable wrapper — applies useDraggable to TaskCardContent */
export function DraggableTaskCard({
  task,
  onMove,
  onDelete,
  onReopen,
  isExpanded,
  onToggleExpand,
  profilesMap,
}: Omit<TaskCardProps, "overlay" | "confirmingDelete" | "onConfirmDelete" | "onCancelDelete" | "activities" | "activitiesLoading" | "reopening" | "reopenNote" | "onStartReopen" | "onCancelReopen" | "onReopenNoteChange" | "onConfirmReopen">) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const cacheKeyRef = useRef<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const confirmingDeleteRef = useRef(false);
  const [reopening, setReopening] = useState(false);
  const [reopenNote, setReopenNote] = useState("");

  useEffect(() => {
    if (!isExpanded) return;
    const key = `${task.id}:${task.status}`;
    if (cacheKeyRef.current === key) return;
    setActivitiesLoading(true);
    const supabase = createClient();
    supabase
      .from("task_activities")
      .select("*")
      .eq("task_id", task.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setActivities(data as TaskActivity[]);
        cacheKeyRef.current = key;
        setActivitiesLoading(false);
      });
  }, [isExpanded, task.id, task.status]);

  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: CSS.Translate.toString(transform) } : undefined}
      className={`touch-none ${isDragging ? "opacity-30" : "cursor-pointer"}`}
      {...listeners}
      {...attributes}
    >
      <TaskCardContent
        task={task}
        onMove={onMove}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        profilesMap={profilesMap}
        activities={activities}
        activitiesLoading={activitiesLoading}
        confirmingDelete={confirmingDelete}
        onCancelDelete={() => {
          confirmingDeleteRef.current = false;
          setConfirmingDelete(false);
        }}
        onConfirmDelete={() => {
          if (!confirmingDeleteRef.current) {
            confirmingDeleteRef.current = true;
            setConfirmingDelete(true);
          } else {
            confirmingDeleteRef.current = false;
            setConfirmingDelete(false);
            onDelete?.(task.id);
          }
        }}
        reopening={reopening}
        reopenNote={reopenNote}
        onStartReopen={() => { setReopening(true); setConfirmingDelete(false); }}
        onCancelReopen={() => { setReopening(false); setReopenNote(""); }}
        onReopenNoteChange={setReopenNote}
        onConfirmReopen={() => {
          setReopening(false);
          onReopen?.(task.id, reopenNote);
          setReopenNote("");
        }}
      />
    </div>
  );
}
