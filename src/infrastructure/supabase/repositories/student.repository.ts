import type { SupabaseClient } from "@supabase/supabase-js";
import type { Student, StudentInsertPayload, StudentStatus } from "@/domain/students/types";

export function createStudentRepository(supabase: SupabaseClient) {
  return {
    async findAll(): Promise<Student[]> {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Student[];
    },

    async create(payload: StudentInsertPayload): Promise<void> {
      const { error } = await supabase.from("students").insert(payload);
      if (error) throw error;
    },

    async update(id: string, payload: Partial<StudentInsertPayload>): Promise<void> {
      const { error } = await supabase.from("students").update(payload).eq("id", id);
      if (error) throw error;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },

    async updateStatus(id: string, status: StudentStatus): Promise<void> {
      const { error } = await supabase.from("students").update({ status }).eq("id", id);
      if (error) throw error;
    },

    async bulkCreate(rows: StudentInsertPayload[]): Promise<void> {
      const { error } = await supabase.from("students").insert(rows);
      if (error) throw error;
    },
  };
}
