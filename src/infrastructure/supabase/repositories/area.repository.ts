import type { SupabaseClient } from "@supabase/supabase-js";
import type { Area } from "@/domain/shared/types";

export function createAreaRepository(supabase: SupabaseClient) {
  return {
    async findAll(): Promise<Area[]> {
      const { data, error } = await supabase.from("areas").select("*");
      if (error) throw error;
      return (data ?? []) as Area[];
    },
  };
}
