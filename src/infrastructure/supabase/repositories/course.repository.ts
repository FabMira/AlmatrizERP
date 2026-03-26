import type { SupabaseClient } from "@supabase/supabase-js";
import type { Course } from "@/domain/shared/types";

export function createCourseRepository(supabase: SupabaseClient) {
  return {
    async findAll(): Promise<Course[]> {
      const { data, error } = await supabase
        .from("courses")
        .select("id, module, module_name, category, title")
        .order("module", { ascending: true })
        .order("category", { ascending: true })
        .order("title", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Course[];
    },

    async setTeacherCourses(teacherId: string, courseIds: string[]): Promise<void> {
      const { error: delErr } = await supabase
        .from("teacher_courses")
        .delete()
        .eq("teacher_id", teacherId);
      if (delErr) throw delErr;

      if (courseIds.length === 0) return;

      const rows = courseIds.map((course_id) => ({ teacher_id: teacherId, course_id }));
      const { error: insErr } = await supabase.from("teacher_courses").insert(rows);
      if (insErr) throw insErr;
    },
  };
}
