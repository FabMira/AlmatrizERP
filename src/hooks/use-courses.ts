"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { createCourseRepository } from "@/infrastructure/supabase/repositories/course.repository";
import type { Course } from "@/domain/shared/types";

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    const supabase = createClient();
    const repo = createCourseRepository(supabase);
    try {
      const data = await repo.findAll();
      setCourses(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  return { courses, loading };
}
