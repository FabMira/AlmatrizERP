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
  event_type: "created" | "status_changed" | "updated";
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
