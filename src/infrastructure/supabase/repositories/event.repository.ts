import type { SupabaseClient } from "@supabase/supabase-js";
import type { CalendarEvent, NewEventForm } from "@/domain/calendar/types";

export function createEventRepository(supabase: SupabaseClient) {
  return {
    async findByMonth(year: number, month: number): Promise<CalendarEvent[]> {
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const { data, error } = await supabase
        .from("events")
        .select("*, areas(id, name, color)")
        .gte("start_at", startOfMonth)
        .lte("start_at", endOfMonth)
        .order("start_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CalendarEvent[];
    },

    async create(
      form: Omit<NewEventForm, "area_id" | "meeting_link" | "description"> & {
        description: string | null;
        area_id: string | null;
        meeting_link: string | null;
        created_by: string | null;
      }
    ): Promise<void> {
      const { error } = await supabase.from("events").insert(form);
      if (error) throw error;
    },

    async update(
      id: string,
      form: {
        title: string;
        description: string | null;
        start_at: string;
        end_at: string;
        area_id: string | null;
        meeting_link: string | null;
      }
    ): Promise<void> {
      const { error } = await supabase.from("events").update(form).eq("id", id);
      if (error) throw error;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
  };
}
