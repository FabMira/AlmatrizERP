import type { StudentStatus, StudentForm } from "./types";

export const EMPTY_STUDENT_FORM: StudentForm = {
  full_name: "",
  email: "",
  phone: "",
  city: "",
  generation: "",
  status: "activa",
  notes: "",
};

export const STATUS_LABELS: Record<StudentStatus, string> = {
  activa: "Activa",
  egresada: "Egresada",
  baja: "Baja",
};

export const STATUS_COLORS: Record<StudentStatus, { color: string; bg: string }> = {
  activa: { color: "var(--color-primary)", bg: "var(--color-primary-fixed)" },
  egresada: { color: "var(--color-on-surface-variant)", bg: "var(--color-surface-container)" },
  baja: { color: "var(--color-error)", bg: "var(--color-error-container)" },
};
