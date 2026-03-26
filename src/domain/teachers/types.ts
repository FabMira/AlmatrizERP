import type { Area } from "@/domain/shared/types";

export type TeacherStatus = "activo" | "licencia" | "nuevo";

export interface Teacher {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  area_id: string | null;
  status: TeacherStatus;
  bio: string | null;
  created_at: string;
  updated_at: string;
  areas: Area | null;
  teacher_courses: { course_id: string }[] | null;
}

export interface TeacherForm {
  full_name: string;
  email: string;
  phone: string;
  subject: string;
  area_id: string;
  status: TeacherStatus;
  bio: string;
  course_ids: string[];
}

export interface TeacherInsertPayload {
  full_name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  area_id: string | null;
  status: TeacherStatus;
  bio: string | null;
}
