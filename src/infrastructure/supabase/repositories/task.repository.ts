import type { SupabaseClient } from "@supabase/supabase-js";
import type { Task, TaskStatus, NewTaskForm } from "@/domain/tasks/types";

export function createTaskRepository(supabase: SupabaseClient) {
  return {
    async findAll(): Promise<Task[]> {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, areas(id, name, color)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Task[];
    },

    async create(
      form: Omit<NewTaskForm, "area_id" | "assigned_to" | "description" | "due_date"> & {
        description: string | null;
        area_id: string | null;
        assigned_to: string | null;
        due_date: string | null;
        created_by: string | null;
      }
    ): Promise<void> {
      const { error } = await supabase.from("tasks").insert(form);
      if (error) throw error;
    },

    async updateStatus(id: string, status: TaskStatus): Promise<void> {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },

    async logActivity(payload: {
      task_id: string;
      event_type: "created" | "status_changed";
      old_status?: string | null;
      new_status?: string | null;
      note?: string | null;
    }): Promise<void> {
      const { error } = await supabase.from("task_activities").insert(payload);
      if (error) throw error;
    },
  };
}
