import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/domain/shared/types";

export function createProfileRepository(supabase: SupabaseClient) {
  return {
    async findAll(): Promise<Profile[]> {
      const { data, error } = await supabase.from("profiles").select("id, full_name, role");
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  };
}
