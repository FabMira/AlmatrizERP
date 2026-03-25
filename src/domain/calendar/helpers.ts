import type { CalendarEvent } from "./types";

export function getEventColor(event: CalendarEvent): string {
  return event.color ?? event.areas?.color ?? "#06B6D4";
}

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateLabel(start: string, end: string): string {
  const s = new Date(start);
  const date = s.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${date} · ${formatTime(start)} – ${formatTime(end)}`;
}
