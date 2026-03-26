import type { SupabaseClient } from "@supabase/supabase-js";
import type { MeetingMinute } from "@/domain/minutes/types";

export function createMinuteRepository(supabase: SupabaseClient) {
  return {
    async findAll(): Promise<MeetingMinute[]> {
      const { data, error } = await supabase
        .from("meeting_minutes")
        .select("*, areas(id, name, color)")
        .order("meeting_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MeetingMinute[];
    },

    async create(form: {
      title: string;
      content: string | null;
      meeting_date: string;
      area_id: string | null;
      attendees: string[];
      created_by: string | null;
    }): Promise<void> {
      const { error } = await supabase.from("meeting_minutes").insert(form);
      if (error) throw error;
    },

    async update(
      id: string,
      data: {
        title: string;
        content: string | null;
        meeting_date: string;
        area_id: string | null;
        attendees: string[];
        updated_at: string;
      }
    ): Promise<void> {
      const { error } = await supabase
        .from("meeting_minutes")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from("meeting_minutes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
  };
}
