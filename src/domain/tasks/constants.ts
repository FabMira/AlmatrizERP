import type { TaskStatus, TaskPriority, NewTaskForm } from "./types";

export const EMPTY_TASK_FORM: NewTaskForm = {
  title: "",
  description: "",
  priority: "media",
  status: "pendiente",
  area_id: "",
  assigned_to: "",
  due_date: "",
};

export const STATUS_ORDER: TaskStatus[] = ["pendiente", "en_progreso", "completada"];

export const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "pendiente", label: "Pendiente" },
  { key: "en_progreso", label: "En Progreso" },
  { key: "completada", label: "Completada" },
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente: "Pendiente",
  en_progreso: "En Progreso",
  completada: "Completada",
};

export const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string; dot: string }> = {
  alta: {
    bg: "var(--color-error-container)",
    text: "var(--color-error)",
    dot: "var(--color-error)",
  },
  media: {
    bg: "var(--color-tertiary-container)",
    text: "var(--color-tertiary)",
    dot: "var(--color-tertiary)",
  },
  baja: {
    bg: "var(--color-surface-container)",
    text: "var(--color-on-surface-variant)",
    dot: "var(--color-outline)",
  },
};
