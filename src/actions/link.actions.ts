"use server";

import { createClient } from "@/infrastructure/supabase/server";
import { createLinkRepository } from "@/infrastructure/supabase/repositories/link.repository";
import type { NewLinkForm } from "@/domain/links/types";

export async function createLinkAction(form: NewLinkForm): Promise<{ error?: string }> {
  if (!form.title.trim()) return { error: "El título es obligatorio." };
  if (!form.url.trim()) return { error: "La URL es obligatoria." };

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(form.url.trim());
  } catch {
    return { error: "La URL no es válida. Debe comenzar con https:// o http://" };
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return { error: "La URL debe comenzar con https:// o http://" };
  }

  const supabase = await createClient();
  const repo = createLinkRepository(supabase);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    await repo.create({
      title: form.title.trim(),
      description: form.description.trim(),
      url: parsedUrl.toString(),
      category: form.category,
      icon: form.icon.trim() || "material-symbols:link-outline",
      created_by: user?.id ?? null,
    });
    return {};
  } catch (err) {
    console.error("[createLinkAction]", err);
    return { error: "Error al guardar. Intenta de nuevo." };
  }
}

export async function deleteLinkAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const repo = createLinkRepository(supabase);

  try {
    await repo.delete(id);
    return {};
  } catch (err) {
    console.error("[deleteLinkAction]", err);
    return { error: "Error al eliminar el link." };
  }
}

export async function togglePinLinkAction(
  id: string,
  pinned: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const repo = createLinkRepository(supabase);

  try {
    await repo.togglePin(id, pinned);
    return {};
  } catch (err) {
    console.error("[togglePinLinkAction]", err);
    return { error: "Error al actualizar el link." };
  }
}

export async function updateLinkAction(
  id: string,
  form: NewLinkForm
): Promise<{ error?: string }> {
  if (!form.title.trim()) return { error: "El título es obligatorio." };
  if (!form.url.trim()) return { error: "La URL es obligatoria." };

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(form.url.trim());
  } catch {
    return { error: "La URL no es válida. Debe comenzar con https:// o http://" };
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return { error: "La URL debe comenzar con https:// o http://" };
  }

  const supabase = await createClient();
  const repo = createLinkRepository(supabase);

  try {
    await repo.update(id, {
      title: form.title.trim(),
      description: form.description.trim(),
      url: parsedUrl.toString(),
      category: form.category,
      icon: form.icon.trim() || "material-symbols:link-outline",
    });
    return {};
  } catch (err) {
    console.error("[updateLinkAction]", err);
    return { error: "Error al guardar los cambios. Intenta de nuevo." };
  }
}
