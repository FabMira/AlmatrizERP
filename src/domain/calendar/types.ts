import type { Area } from "@/domain/shared/types";

export interface CalendarEvent {
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

export const EMPTY_EVENT_FORM: NewEventForm = {
  title: "",
  description: "",
  start_at: "",
  end_at: "",
  area_id: "",
  meeting_link: "",
};
