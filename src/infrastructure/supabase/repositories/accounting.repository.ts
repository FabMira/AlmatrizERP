import type { SupabaseClient } from "@supabase/supabase-js";

interface FindAllOptions {
  orderBy?: string;
  ascending?: boolean;
  filters?: Record<string, string>;
}

export function createAccountingRepository(supabase: SupabaseClient) {
  return {
    async findAll(table: string, options: FindAllOptions = {}): Promise<Record<string, unknown>[]> {
      const { orderBy = "created_at", ascending = false, filters = {} } = options;

      let query = supabase.from(table).select("*");

      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }

      query = query.order(orderBy, { ascending });

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Record<string, unknown>[];
    },

    async create(table: string, data: Record<string, unknown>): Promise<void> {
      const { error } = await supabase.from(table).insert(data);
      if (error) throw error;
    },

    async update(table: string, id: string, data: Record<string, unknown>): Promise<void> {
      const { error } = await supabase.from(table).update(data).eq("id", id);
      if (error) throw error;
    },

    async delete(table: string, id: string): Promise<void> {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },

    async bulkInsert(table: string, rows: Record<string, unknown>[]): Promise<number> {
      if (rows.length === 0) return 0;
      const BATCH_SIZE = 500;
      let total = 0;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from(table).insert(batch);
        if (error) throw error;
        total += batch.length;
      }
      return total;
    },
  };
}
