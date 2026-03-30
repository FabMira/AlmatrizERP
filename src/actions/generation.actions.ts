"use server";

import { createClient } from "@/infrastructure/supabase/server";
import { createGenerationRepository } from "@/infrastructure/supabase/repositories/generation.repository";

export async function createGenerationAction(
  name: string,
  label: string | null
): Promise<{ error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "El nombre de la generación es obligatorio." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado." };
  const repo = createGenerationRepository(supabase);

  try {
    await repo.create(trimmed, label?.trim() || null);
    return {};
  } catch (e: unknown) {
    const pg = e as { code?: string };
    if (pg?.code === "23505") {
      return { error: "Ya existe una generación con ese nombre." };
    }
    return { error: "Error al guardar. Intenta de nuevo." };
  }
}
