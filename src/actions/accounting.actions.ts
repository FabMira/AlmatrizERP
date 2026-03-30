"use server";

import { createClient } from "@/infrastructure/supabase/server";
import { createAccountingRepository } from "@/infrastructure/supabase/repositories/accounting.repository";

// ── Security: hardcoded slug → table allowlist ─────────────────────────────────

const SLUG_TO_TABLE: Record<string, string> = {
  "libro-diario": "acc_journal",
  "historico": "acc_history",
  "transbank": "acc_card_sales",
  "gastos": "acc_expenses",
  "escuela-v25": "acc_program_payments",
  "escuela-v26": "acc_program_payments",
  "formacion-continua": "acc_program_payments",
  "consolidado": "acc_monthly_summary",
  "proyeccion": "acc_budget",
};

const SLUG_TO_PROGRAMA: Record<string, string> = {
  "escuela-v25": "escuela_v25",
  "escuela-v26": "escuela_v26",
  "formacion-continua": "formacion_continua",
};

function resolveTable(slug: string): string {
  const table = SLUG_TO_TABLE[slug];
  if (!table) throw new Error(`Unknown section: ${slug}`);
  return table;
}

export async function createAccountingRecordAction(
  section: string,
  formData: Record<string, unknown>
): Promise<{ error?: string }> {
  const table = resolveTable(section);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const payload: Record<string, unknown> = { ...formData, created_by: user?.id ?? null };

  // Auto-set programa for program payment sections
  const programa = SLUG_TO_PROGRAMA[section];
  if (programa) {
    payload.programa = programa;
  }

  // Convert numeric string fields to integers.
  // Only match strings that have no leading zeros, preventing text fields
  // like n_doc="001" from being coerced to the integer 1.
  const intPattern = /^([1-9]\d*|0)$/;
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string" && intPattern.test(value)) {
      payload[key] = Number(value);
    }
  }

  const repo = createAccountingRepository(supabase);

  try {
    await repo.create(table, payload);
    return {};
  } catch {
    return { error: "Error al guardar el registro. Intenta de nuevo." };
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateAccountingRecordAction(
  section: string,
  id: string,
  formData: Record<string, unknown>
): Promise<{ error?: string }> {
  if (!UUID_RE.test(id)) return { error: "ID de registro inválido." };

  const table = resolveTable(section);

  const supabase = await createClient();

  const payload: Record<string, unknown> = { ...formData };

  // Convert numeric string fields to integers (no leading-zero strings).
  const intPattern = /^([1-9]\d*|0)$/;
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string" && intPattern.test(value)) {
      payload[key] = Number(value);
    }
  }

  // Remove computed/immutable fields
  delete payload.id;
  delete payload.created_at;
  delete payload.created_by;
  delete payload.variacion;

  const repo = createAccountingRepository(supabase);

  try {
    await repo.update(table, id, payload);
    return {};
  } catch {
    return { error: "Error al actualizar el registro. Intenta de nuevo." };
  }
}

export async function deleteAccountingRecordAction(
  section: string,
  id: string
): Promise<{ error?: string }> {
  if (!UUID_RE.test(id)) return { error: "ID de registro inválido." };

  const table = resolveTable(section);

  const supabase = await createClient();
  const repo = createAccountingRepository(supabase);

  try {
    await repo.delete(table, id);
    return {};
  } catch {
    return { error: "Error al eliminar el registro. Intenta de nuevo." };
  }
}

// ── Bulk import ───────────────────────────────────────────────────────────────

export interface ImportBatch {
  slug: string;
  rows: Record<string, unknown>[];
}

// Tables that have a created_by column
const TABLES_WITH_CREATED_BY = new Set([
  "acc_journal",
  "acc_history",
  "acc_card_sales",
  "acc_expenses",
  "acc_program_payments",
]);

export async function bulkImportAccountingAction(
  batches: ImportBatch[]
): Promise<{ error?: string; totals?: Record<string, number> }> {
  // Validate all slugs before touching the DB (fail fast)
  for (const batch of batches) {
    resolveTable(batch.slug);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const repo = createAccountingRepository(supabase);

  const totals: Record<string, number> = {};

  try {
    for (const batch of batches) {
      if (batch.rows.length === 0) continue;
      const table = resolveTable(batch.slug);
      const rows = TABLES_WITH_CREATED_BY.has(table)
        ? batch.rows.map((row) => ({ ...row, created_by: user?.id ?? null }))
        : batch.rows;
      const count = await repo.bulkInsert(table, rows);
      totals[batch.slug] = (totals[batch.slug] ?? 0) + count;
    }
    return { totals };
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : JSON.stringify(err);
    return { error: `Error al importar datos: ${msg}` };
  }
}
