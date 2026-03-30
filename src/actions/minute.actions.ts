"use server";

import { createClient } from "@/infrastructure/supabase/server";
import { createMinuteRepository } from "@/infrastructure/supabase/repositories/minute.repository";
import type { NewMinuteForm } from "@/domain/minutes/types";

function parseAttendees(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createMinuteAction(
  form: NewMinuteForm
): Promise<{ error?: string }> {
  if (!form.title.trim()) return { error: "El título es obligatorio." };
  if (!form.meeting_date) return { error: "La fecha es obligatoria." };

  const supabase = await createClient();
  const repo = createMinuteRepository(supabase);
  const { data: { user } } = await supabase.auth.getUser();

  try {
    await repo.create({
      title: form.title.trim(),
      content: form.content.trim() || null,
      meeting_date: form.meeting_date,
      area_id: form.area_id || null,
      attendees: parseAttendees(form.attendees),
      created_by: user?.id ?? null,
    });
    return {};
  } catch {
    return { error: "Error al guardar el acta. Intenta de nuevo." };
  }
}

export async function updateMinuteAction(
  id: string,
  form: NewMinuteForm
): Promise<{ error?: string }> {
  if (!form.title.trim()) return { error: "El título es obligatorio." };
  if (!form.meeting_date) return { error: "La fecha es obligatoria." };

  const supabase = await createClient();
  const repo = createMinuteRepository(supabase);

  try {
    await repo.update(id, {
      title: form.title.trim(),
      content: form.content.trim() || null,
      meeting_date: form.meeting_date,
      area_id: form.area_id || null,
      attendees: parseAttendees(form.attendees),
      updated_at: new Date().toISOString(),
    });
    return {};
  } catch {
    return { error: "Error al actualizar el acta. Intenta de nuevo." };
  }
}

export async function deleteMinuteAction(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado." };
  const repo = createMinuteRepository(supabase);

  try {
    await repo.delete(id);
    return {};
  } catch {
    return { error: "Error al eliminar el acta. Intenta de nuevo." };
  }
}
