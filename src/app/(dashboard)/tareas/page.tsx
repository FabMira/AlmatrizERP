"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { createClient } from "@/lib/supabase/client";
import type { Task, TaskStatus } from "./_types";
import { COLUMNS, STATUS_ORDER } from "./_types";
import AddTaskModal from "./_components/AddTaskModal";
import { DraggableTaskCard, TaskCardContent } from "./_components/TaskCard";

interface Area {
  id: string;
  name: string;
  color: string;
}


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

const supabase = createClient();

/** Wraps a column's card list with a droppable zone, highlighting it when a card hovers over */
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
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

export default function TareasPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [activeAreaId, setActiveAreaId] = useState("all");
  const [activePriority, setActivePriority] = useState("all");
  const [loading, setLoading] = useState(true);
  const [addResetKey, setAddResetKey] = useState(0);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("pendiente");
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const addModal = useOverlayState();

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*, areas(id, name, color)")
      .order("created_at", { ascending: false });
    if (!error && data) setTasks(data as Task[]);
    setLoading(false);
  }, []);

  const fetchAreas = useCallback(async () => {
    const { data } = await supabase.from("areas").select("*");
    if (data) setAreas(data as Area[]);
  }, []);

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("id, full_name");
    if (data) {
      const map: Record<string, string> = {};
      for (const p of data) map[p.id] = p.full_name ?? p.id.slice(0, 8) + "\u2026";
      setProfilesMap(map);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchAreas();
    fetchProfiles();
  }, [fetchTasks, fetchAreas, fetchProfiles]);

  // ── Realtime ───────────────────────────────────────────────────────────────

  const fetchTasksRef = useRef(fetchTasks);
  useEffect(() => { fetchTasksRef.current = fetchTasks; }, [fetchTasks]);

  useEffect(() => {
    const channel = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => fetchTasksRef.current())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Status change (optimistic) ─────────────────────────────────────────────

  async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
    if (error) {
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: task.status } : t));
    }
  }

  async function moveTask(taskId: string, direction: 1 | -1) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const currentIndex = STATUS_ORDER.indexOf(task.status);
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= STATUS_ORDER.length) return;
    await updateTaskStatus(taskId, STATUS_ORDER[nextIndex]);
  }

  async function deleteTask(taskId: string) {
    const snapshot = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error && snapshot) {
      setTasks((prev) => [snapshot, ...prev]);
    }
  }

  async function reopenTask(taskId: string, note: string) {
    await updateTaskStatus(taskId, "en_progreso");
    if (note.trim()) {
      await supabase.from("task_activities").insert({
        task_id: taskId,
        event_type: "status_changed",
        old_status: "completada",
        new_status: "en_progreso",
        note: note.trim(),
      });
    }
  }

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
    updateTaskStatus(active.id as string, targetStatus);
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

