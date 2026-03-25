export type StudentStatus = "activa" | "egresada" | "baja";

export interface Student {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  generation: string;
  status: StudentStatus;
  notes: string | null;
  created_at: string;
}

export interface Generation {
  id: string;
  name: string;
  label: string | null;
  created_at: string;
}

export interface StudentForm {
  full_name: string;
  email: string;
  phone: string;
  city: string;
  generation: string;
  status: StudentStatus;
  notes: string;
}

export interface StudentInsertPayload {
  full_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  generation: string;
  status: StudentStatus;
  notes: string | null;
}
