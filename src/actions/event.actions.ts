"use server";

import { createClient } from "@/infrastructure/supabase/server";
import { createEventRepository } from "@/infrastructure/supabase/repositories/event.repository";
import type { NewEventForm } from "@/domain/calendar/types";

export async function createEventAction(form: NewEventForm): Promise<{ error?: string }> {
  if (!form.title.trim()) return { error: "El título es obligatorio." };
  if (!form.start_at || !form.end_at) return { error: "Las fechas son obligatorias." };
  if (new Date(form.end_at) <= new Date(form.start_at)) {
    return { error: "La fecha de fin debe ser posterior al inicio." };
  }

  const supabase = await createClient();
  const repo = createEventRepository(supabase);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    await repo.create({
      title: form.title.trim(),
      description: form.description.trim() || null,
      start_at: new Date(form.start_at).toISOString(),
      end_at: new Date(form.end_at).toISOString(),
      area_id: form.area_id || null,
      meeting_link: form.meeting_link.trim() || null,
      created_by: user?.id ?? null,
    });
    return {};
  } catch {
    return { error: "Error al guardar. Intenta de nuevo." };
  }
}

export async function deleteEventAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado." };
  const repo = createEventRepository(supabase);

  try {
    await repo.delete(id);
    return {};
  } catch {
    return { error: "Error al eliminar el evento." };
  }
}
