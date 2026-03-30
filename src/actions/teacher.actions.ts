"use server";

import { createClient } from "@/infrastructure/supabase/server";
import { createTeacherRepository } from "@/infrastructure/supabase/repositories/teacher.repository";
import type { TeacherForm, TeacherStatus } from "@/domain/teachers/types";

export async function createTeacherAction(form: TeacherForm): Promise<{ error?: string }> {
  if (!form.full_name.trim()) return { error: "El nombre completo es obligatorio." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado." };
  const repo = createTeacherRepository(supabase);

  try {
    const newId = await repo.create({
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      subject: form.subject.trim() || null,
      area_id: form.area_id || null,
      status: form.status,
      bio: form.bio.trim() || null,
    });
    await repo.setCourses(newId, form.course_ids);
    return {};
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : JSON.stringify(e);
    return { error: msg };
  }
}

export async function updateTeacherAction(
  id: string,
  form: TeacherForm
): Promise<{ error?: string }> {
  if (!form.full_name.trim()) return { error: "El nombre completo es obligatorio." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado." };
  const repo = createTeacherRepository(supabase);

  try {
    await repo.update(id, {
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      subject: form.subject.trim() || null,
      area_id: form.area_id || null,
      status: form.status,
      bio: form.bio.trim() || null,
    });
    await repo.setCourses(id, form.course_ids);
    return {};
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : JSON.stringify(e);
    return { error: msg };
  }
}

export async function deleteTeacherAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado." };
  const repo = createTeacherRepository(supabase);

  try {
    await repo.delete(id);
    return {};
  } catch {
    return { error: "Error al eliminar. Intenta de nuevo." };
  }
}

export async function updateTeacherStatusAction(
  id: string,
  status: TeacherStatus
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado." };
  const repo = createTeacherRepository(supabase);

  try {
    await repo.updateStatus(id, status);
    return {};
  } catch {
    return { error: "Error al actualizar el estado." };
  }
}
