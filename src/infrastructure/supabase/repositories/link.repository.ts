import type { SupabaseClient } from "@supabase/supabase-js";
import type { Link, NewLinkForm } from "@/domain/links/types";

export function createLinkRepository(supabase: SupabaseClient) {
  return {
    async findAll(): Promise<Link[]> {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Link[];
    },

    async create(
      form: NewLinkForm & { created_by: string | null }
    ): Promise<void> {
      const { error } = await supabase.from("links").insert(form);
      if (error) throw error;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase.from("links").delete().eq("id", id);
      if (error) throw error;
    },

    async togglePin(id: string, pinned: boolean): Promise<void> {
      const { error } = await supabase
        .from("links")
        .update({ pinned })
        .eq("id", id);
      if (error) throw error;
    },

    async update(id: string, form: NewLinkForm): Promise<void> {
      const { error } = await supabase
        .from("links")
        .update({
          title: form.title,
          description: form.description,
          url: form.url,
          category: form.category,
          icon: form.icon,
        })
        .eq("id", id);
      if (error) throw error;
    },
  };
}