import type { Area } from "@/domain/shared/types";

export interface MeetingMinute {
  id: string;
  title: string;
  content: string | null;
  meeting_date: string;
  area_id: string | null;
  created_by: string | null;
  attendees: string[];
  created_at: string;
  updated_at: string;
  areas: Area | null;
}

export interface NewMinuteForm {
  title: string;
  content: string;
  meeting_date: string;
  area_id: string;
  attendees: string;
}

export const EMPTY_MINUTE_FORM: NewMinuteForm = {
  title: "",
  content: "",
  meeting_date: new Date().toISOString().split("T")[0],
  area_id: "",
  attendees: "",
};
