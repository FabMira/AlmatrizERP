import { SECTIONS } from "./constants";
import type { SectionConfig } from "./types";

const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function formatCLP(amount: number): string {
  return clpFormatter.format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-CL");
}

export function getSectionBySlug(slug: string): SectionConfig | undefined {
  return SECTIONS.find((s) => s.slug === slug);
}

const MONTH_LABELS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function getMonthLabel(month: number): string {
  return MONTH_LABELS[(month - 1) % 12] ?? String(month);
}
