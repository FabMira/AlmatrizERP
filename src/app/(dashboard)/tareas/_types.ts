// Required Supabase table — run once in your SQL editor:
//
// create table tasks (
//   id uuid primary key default gen_random_uuid(),
//   title text not null,
//   description text,
//   priority text not null default 'media'
//     check (priority in ('alta', 'media', 'baja')),
//   status text not null default 'pendiente'
//     check (status in ('pendiente', 'en_progreso', 'completada')),
//   area_id uuid references areas(id) on delete set null,
//   assigned_to uuid references auth.users(id) on delete set null,
//   due_date date,
//   created_by uuid references auth.users(id) on delete set null,
//   created_at timestamptz default now()
// );
//
// Profiles view (run if you don't already have a profiles table):
//
// create view public.profiles as
//   select id, email, raw_user_meta_data->>'full_name' as full_name
//   from auth.users;
//
// grant select on public.profiles to authenticated;
//
// Activity log table (run after creating the tasks table):
//
// create table task_activities (
//   id uuid primary key default gen_random_uuid(),
//   task_id uuid not null references tasks(id) on delete cascade,
//   event_type text not null check (event_type in ('created', 'status_changed')),
//   old_status text,
//   new_status text,
//   created_at timestamptz default now()
// );
//
// alter table task_activities enable row level security;
// create policy "Authenticated users can read activities"
//   on task_activities for select to authenticated using (true);
// create policy "Authenticated users can insert activities"
//   on task_activities for insert to authenticated with check (true);
//
// -- Add note column for reopen reasons (run if table already exists)
// alter table task_activities add column if not exists note text;
//
// -- Trigger: auto-log task creation
// -- SECURITY DEFINER lets the function bypass RLS on task_activities
// create or replace function log_task_created() returns trigger language plpgsql security definer as $$
// begin
//   insert into task_activities(task_id, event_type, new_status)
//   values (new.id, 'created', new.status);
//   return new;
// end; $$;
// create trigger on_task_created after insert on tasks
//   for each row execute function log_task_created();
//
// -- Trigger: auto-log status changes
// create or replace function log_task_status_change() returns trigger language plpgsql security definer as $$
// begin
//   if old.status is distinct from new.status then
//     insert into task_activities(task_id, event_type, old_status, new_status)
//     values (new.id, 'status_changed', old.status, new.status);
//   end if;
//   return new;
// end; $$;
// create trigger on_task_status_changed after update on tasks
//   for each row execute function log_task_status_change();

export type TaskStatus = "pendiente" | "en_progreso" | "completada";
export type TaskPriority = "alta" | "media" | "baja";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  area_id: string | null;
  assigned_to: string | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  areas: { id: string; name: string; color: string } | null;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  event_type: "created" | "status_changed";
  old_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
}

export interface NewTaskForm {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  area_id: string;
  assigned_to: string;
  due_date: string;
}

export const EMPTY_TASK_FORM: NewTaskForm = {
  title: "",
  description: "",
  priority: "media",
  status: "pendiente",
  area_id: "",
  assigned_to: "",
  due_date: "",
};

export const STATUS_ORDER: TaskStatus[] = ["pendiente", "en_progreso", "completada"];

export const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "pendiente", label: "Pendiente" },
  { key: "en_progreso", label: "En Progreso" },
  { key: "completada", label: "Completada" },
];

export const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En Progreso",
  completada: "Completada",
};

export const PRIORITY_COLORS: Record<
  TaskPriority,
  { bg: string; text: string; dot: string }
> = {
  alta: { bg: "var(--color-error-container)", text: "var(--color-error)", dot: "#ba1a1a" },
  media: { bg: "var(--color-tertiary-container)", text: "var(--color-tertiary)", dot: "#8c5000" },
  baja: { bg: "var(--color-primary-container)", text: "var(--color-primary)", dot: "#00687a" },
};
