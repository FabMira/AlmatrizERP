import type { SupabaseClient } from "@supabase/supabase-js";
import type { Teacher, TeacherInsertPayload, TeacherStatus } from "@/domain/teachers/types";
import { createCourseRepository } from "./course.repository";

export function createTeacherRepository(supabase: SupabaseClient) {
  return {
    async findAll(): Promise<Teacher[]> {
      const { data, error } = await supabase
        .from("teachers")
        .select("*, areas(id, name, color), teacher_courses(course_id)")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Teacher[];
    },

    async create(payload: TeacherInsertPayload): Promise<string> {
      const { data, error } = await supabase
        .from("teachers")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },

    async update(id: string, payload: Partial<TeacherInsertPayload>): Promise<void> {
      const { error } = await supabase
        .from("teachers")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
    },

    async updateStatus(id: string, status: TeacherStatus): Promise<void> {
      const { error } = await supabase
        .from("teachers")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },

    setCourses: createCourseRepository(supabase).setTeacherCourses,
  };
}
