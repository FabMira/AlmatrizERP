import type { SupabaseClient } from "@supabase/supabase-js";
import type { Generation } from "@/domain/students/types";

export function createGenerationRepository(supabase: SupabaseClient) {
  return {
    async findAll(): Promise<Generation[]> {
      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .order("name", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Generation[];
    },

    async create(name: string, label: string | null): Promise<void> {
      const { error } = await supabase.from("generations").insert({ name, label });
      if (error) throw error;
    },
  };
}
