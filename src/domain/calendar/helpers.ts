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

// ── Calendar export helpers ────────────────────────────────────────────────

/** Format a Date to iCalendar YYYYMMDDTHHMMSSZ */
function toICSDate(iso: string): string {
  const d = new Date(iso);
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Generate an .ics file string for a single event and trigger a download. */
export function downloadICS(event: CalendarEvent): void {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AlmatrizERP//ES",
    "BEGIN:VEVENT",
    `DTSTART:${toICSDate(event.start_at)}`,
    `DTEND:${toICSDate(event.end_at)}`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}` : "",
    event.meeting_link ? `URL:${event.meeting_link}` : "",
    `UID:${event.id}@almatrizerp`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/\s+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Build a Google Calendar "add event" URL for a single event. */
export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toICSDate(event.start_at)}/${toICSDate(event.end_at)}`,
  });
  if (event.description) params.set("details", event.description);
  if (event.meeting_link) params.set("location", event.meeting_link);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
