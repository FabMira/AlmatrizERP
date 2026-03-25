"use client";

import { useState } from "react";
import { Button, Skeleton, useOverlayState } from "@heroui/react";
import { Icon } from "@iconify/react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useTasks } from "@/hooks/use-tasks";
import { useAreas } from "@/hooks/use-areas";
import { useProfiles } from "@/hooks/use-profiles";
import type { Task, TaskStatus } from "@/domain/tasks/types";
import { COLUMNS } from "@/domain/tasks/constants";
import AddTaskModal from "./_components/AddTaskModal";
import { DraggableTaskCard, TaskCardContent } from "./_components/TaskCard";
import DroppableColumn from "./_components/DroppableColumn";


const priorities = [
  { label: "Todos", value: "all" },
  { label: "Alta", value: "alta" },
  { label: "Media", value: "media" },
  { label: "Baja", value: "baja" },
];

const columnBorders = ["var(--color-outline-variant)", "var(--color-tertiary)", "var(--color-primary)"];
const columnHeaderColors = [
  "text-[var(--color-on-surface-variant)]",
  "text-[var(--color-tertiary)]",
  "text-[var(--color-primary)]",
];

export default function TareasPage() {
  const { tasks, loading, fetchTasks, updateStatus, moveTask, deleteTask, reopenTask } = useTasks();
  const { areas } = useAreas();
  const { profilesMap } = useProfiles();
  const [activeAreaId, setActiveAreaId] = useState("all");
  const [activePriority, setActivePriority] = useState("all");
  const [addResetKey, setAddResetKey] = useState(0);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("pendiente");
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const addModal = useOverlayState();

  // ── Drag handlers ──────────────────────────────────────────────────────────

  function handleDragStart({ active }: DragStartEvent) {
    const task = tasks.find((t) => t.id === active.id);
    setDraggingTask(task ?? null);
    setExpandedTaskId(null); // collapse on drag start
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDraggingTask(null);
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    const targetStatus = over.id as TaskStatus;
    // Completed tasks cannot be dragged back to pendiente
    if (task?.status === "completada" && targetStatus === "pendiente") return;
    updateStatus(active.id as string, targetStatus);
  }

  // ── Open add modal ─────────────────────────────────────────────────────────

  function openAddModal(status: TaskStatus) {
    setDefaultStatus(status);
    setAddResetKey((k) => k + 1);
    addModal.open();
  }

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filteredTasks = tasks.filter((t) => {
    if (activeAreaId !== "all" && t.area_id !== activeAreaId) return false;
    if (activePriority !== "all" && t.priority !== activePriority) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <select
          className="h-9 px-3 rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-48"
          value={activeAreaId}
          onChange={(e) => setActiveAreaId(e.target.value)}
        >
          <option value="all">Todas las áreas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
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
            onPress={() => openAddModal("pendiente")}
          >
            <Icon icon="material-symbols:add" className="text-lg" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-scroll flex lg:grid lg:grid-cols-3 gap-4">
          {COLUMNS.map((col, ci) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.key);
            return (
              <div
                key={col.key}
                className="kanban-column flex flex-col rounded-2xl bg-[var(--color-surface-container-low)] p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: columnBorders[ci] }}
                    />
                    <span className={`font-bold text-sm ${columnHeaderColors[ci]}`}>
                      {col.label}
                    </span>
                  </div>
                  <span className="bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] text-xs font-semibold rounded-full px-2 py-0.5">
                    {loading ? "–" : columnTasks.length}
                  </span>
                </div>

                <DroppableColumn id={col.key}>
                  {loading
                    ? Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                      ))
                    : columnTasks.map((task) => (
                        <DraggableTaskCard
                          key={task.id}
                          task={task}
                          onMove={moveTask}
                          onDelete={deleteTask}
                          onReopen={reopenTask}
                          isExpanded={expandedTaskId === task.id}
                          onToggleExpand={() =>
                            setExpandedTaskId((prev) => (prev === task.id ? null : task.id))
                          }
                          profilesMap={profilesMap}
                        />
                      ))}
                </DroppableColumn>

                <button
                  className="mt-3 flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors py-2 cursor-pointer"
                  onClick={() => openAddModal(col.key)}
                >
                  <Icon icon="material-symbols:add-circle-outline" className="text-base" />
                  Agregar tarea
                </button>
              </div>
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {draggingTask ? (
            <div className="w-72 rotate-2 opacity-95 drop-shadow-2xl">
              <TaskCardContent task={draggingTask} onMove={() => {}} overlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AddTaskModal
        state={addModal}
        areas={areas}
        defaultStatus={defaultStatus}
        resetKey={addResetKey}
        onCreated={fetchTasks}
      />
    </div>
  );
}

