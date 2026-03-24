// ── Required Supabase SQL — run once in your SQL editor ──────────────────────
//
// -- 1. Add city column to students (if not already present)
// alter table students add column if not exists city text;
//
// -- 2. Ensure RLS is enabled on students with full authenticated access
// alter table students enable row level security;
// create policy "Auth select students"
//   on students for select to authenticated using (true);
// create policy "Auth insert students"
//   on students for insert to authenticated with check (true);
// create policy "Auth update students"
//   on students for update to authenticated using (true);
// create policy "Auth delete students"
//   on students for delete to authenticated using (true);
//
// -- 3. Create generations table
// create table generations (
//   id uuid primary key default gen_random_uuid(),
//   name text not null unique,
//   label text,
//   created_at timestamptz default now()
// );
// alter table generations enable row level security;
// create policy "Auth read generations"
//   on generations for select to authenticated using (true);
// create policy "Auth insert generations"
//   on generations for insert to authenticated with check (true);
// create policy "Auth update generations"
//   on generations for update to authenticated using (true);
//
// -- 4. Seed generations from existing student data
// insert into generations (name)
// select distinct generation from students
// on conflict (name) do nothing;

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
