"use server";

import { createClient } from "@/infrastructure/supabase/server";
import { createStudentRepository } from "@/infrastructure/supabase/repositories/student.repository";
import type { StudentForm, StudentStatus } from "@/domain/students/types";

export async function createStudentAction(form: StudentForm): Promise<{ error?: string }> {
  if (!form.full_name.trim()) return { error: "El nombre completo es obligatorio." };
  if (!form.generation) return { error: "La generación es obligatoria." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado." };
  const repo = createStudentRepository(supabase);

  try {
    await repo.create({
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      city: form.city.trim() || null,
      generation: form.generation,
      status: form.status,
      notes: form.notes.trim() || null,
    });
    return {};
  } catch {
    return { error: "Error al guardar. Intenta de nuevo." };
  }
}

export async function updateStudentAction(
  id: string,
  form: StudentForm
): Promise<{ error?: string }> {
  if (!form.full_name.trim()) return { error: "El nombre completo es obligatorio." };
  if (!form.generation) return { error: "La generación es obligatoria." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado." };
  const repo = createStudentRepository(supabase);

  try {
    await repo.update(id, {
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      city: form.city.trim() || null,
      generation: form.generation,
      status: form.status,
      notes: form.notes.trim() || null,
    });
    return {};
  } catch {
    return { error: "Error al guardar. Intenta de nuevo." };
  }
}

export async function deleteStudentAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado." };
  const repo = createStudentRepository(supabase);

  try {
    await repo.delete(id);
    return {};
  } catch {
    return { error: "Error al eliminar. Intenta de nuevo." };
  }
}

export async function updateStudentStatusAction(
  id: string,
  status: StudentStatus
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado." };
  const repo = createStudentRepository(supabase);

  try {
    await repo.updateStatus(id, status);
    return {};
  } catch {
    return { error: "Error al actualizar el estado." };
  }
}

export async function importStudentsCsvAction(
  rows: Array<{
    full_name: string;
    phone: string | null;
    email: string | null;
    city: string | null;
    generation: string;
  }>
): Promise<{ error?: string }> {
  if (rows.length === 0) return { error: "No hay filas válidas para importar." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado." };
  const repo = createStudentRepository(supabase);

  try {
    await repo.bulkCreate(
      rows.map((r) => ({ ...r, status: "activa" as const, notes: null }))
    );
    return {};
  } catch {
    return { error: "Error al importar. Intenta de nuevo." };
  }
}
