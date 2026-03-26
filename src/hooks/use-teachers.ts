"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { createTeacherRepository } from "@/infrastructure/supabase/repositories/teacher.repository";
import { updateTeacherStatusAction, deleteTeacherAction } from "@/actions/teacher.actions";
import { useRealtime } from "./use-realtime";
import type { Teacher, TeacherStatus } from "@/domain/teachers/types";

export function useTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeachers = useCallback(async () => {
    const supabase = createClient();
    const repo = createTeacherRepository(supabase);
    try {
      const data = await repo.findAll();
      setTeachers(data);
    } catch {
      // silently ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);
  useRealtime("teachers", fetchTeachers);

  async function deleteTeacher(id: string) {
    const prev = teachers;
    setTeachers((list) => list.filter((t) => t.id !== id));
    const result = await deleteTeacherAction(id);
    if (result.error) {
      setTeachers(prev);
    }
  }

  async function updateStatus(id: string, status: TeacherStatus) {
    const prev = teachers.find((t) => t.id === id);
    setTeachers((list) => list.map((t) => (t.id === id ? { ...t, status } : t)));
    const result = await updateTeacherStatusAction(id, status);
    if (result.error && prev) {
      setTeachers((list) => list.map((t) => (t.id === id ? prev : t)));
    }
  }

  return { teachers, loading, fetchTeachers, deleteTeacher, updateStatus };
}
