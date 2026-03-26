"use server";

import { createClient } from "@/infrastructure/supabase/server";
import { createTaskRepository } from "@/infrastructure/supabase/repositories/task.repository";
import type { NewTaskForm, TaskStatus } from "@/domain/tasks/types";

export async function createTaskAction(form: NewTaskForm): Promise<{ error?: string }> {
  if (!form.title.trim()) return { error: "El título es obligatorio." };

  const supabase = await createClient();
  const repo = createTaskRepository(supabase);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    await repo.create({
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      status: form.status,
      area_id: form.area_id || null,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
      created_by: user?.id ?? null,
    });
    return {};
  } catch {
    return { error: "Error al guardar. Intenta de nuevo." };
  }
}

export async function updateTaskAction(
  id: string,
  form: NewTaskForm
): Promise<{ error?: string }> {
  if (!form.title.trim()) return { error: "El título es obligatorio." };

  const supabase = await createClient();
  const repo = createTaskRepository(supabase);

  try {
    await repo.update(id, {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      area_id: form.area_id || null,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  // Log activity separately — don't fail the whole operation if this errors
  try {
    await repo.logActivity({ task_id: id, event_type: "updated" });
  } catch {
    // Activity log failure is non-fatal
  }

  return {};
}

export async function updateTaskStatusAction(
  id: string,
  status: TaskStatus,
  prevStatus?: TaskStatus
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const repo = createTaskRepository(supabase);

  try {
    await repo.updateStatus(id, status);
    if (prevStatus && prevStatus !== status) {
      await repo.logActivity({
        task_id: id,
        event_type: "status_changed",
        old_status: prevStatus,
        new_status: status,
      });
    }
    return {};
  } catch {
    return { error: "Error al actualizar el estado." };
  }
}

export async function deleteTaskAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const repo = createTaskRepository(supabase);

  try {
    await repo.delete(id);
    return {};
  } catch {
    return { error: "Error al eliminar la tarea." };
  }
}

export async function reopenTaskAction(
  id: string,
  note: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const repo = createTaskRepository(supabase);

  try {
    await repo.updateStatus(id, "en_progreso");
    await repo.logActivity({
      task_id: id,
      event_type: "status_changed",
      old_status: "completada",
      new_status: "en_progreso",
      note: note.trim() || null,
    });
    return {};
  } catch {
    return { error: "Error al reabrir la tarea." };
  }
}
