import type { TeacherStatus, TeacherForm } from "./types";

export const EMPTY_TEACHER_FORM: TeacherForm = {
  full_name: "",
  email: "",
  phone: "",
  subject: "",
  area_id: "",
  status: "activo",
  bio: "",
  course_ids: [],
};

export const STATUS_LABELS: Record<TeacherStatus, string> = {
  activo: "Activo",
  licencia: "En Licencia",
  nuevo: "Nuevo",
};

export const STATUS_COLORS: Record<TeacherStatus, { color: string; bg: string }> = {
  activo: { color: "var(--color-primary)", bg: "var(--color-primary-fixed)" },
  licencia: { color: "var(--color-tertiary)", bg: "var(--color-tertiary-fixed)" },
  nuevo: { color: "var(--color-secondary)", bg: "var(--color-secondary-container)" },
};
