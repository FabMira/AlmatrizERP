export interface Area {
  id: string;
  name: string;
  color: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  area_id: string | null;
  meeting_link: string | null;
  color: string | null;
  areas: Area | null;
}

export interface NewEventForm {
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  area_id: string;
  meeting_link: string;
}

export const EMPTY_FORM: NewEventForm = {
  title: "",
  description: "",
  start_at: "",
  end_at: "",
  area_id: "",
  meeting_link: "",
};

export function getEventColor(event: Event): string {
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
