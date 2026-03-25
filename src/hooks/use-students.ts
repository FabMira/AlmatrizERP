"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { createStudentRepository } from "@/infrastructure/supabase/repositories/student.repository";
import { updateStudentStatusAction } from "@/actions/student.actions";
import { useRealtime } from "./use-realtime";
import type { Student, StudentStatus } from "@/domain/students/types";

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    const supabase = createClient();
    const repo = createStudentRepository(supabase);
    try {
      const data = await repo.findAll();
      setStudents(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useRealtime("students", fetchStudents);

  async function updateStatus(id: string, status: StudentStatus) {
    const prev = students.find((s) => s.id === id);
    // Optimistic update
    setStudents((list) => list.map((s) => (s.id === id ? { ...s, status } : s)));
    const result = await updateStudentStatusAction(id, status);
    if (result.error && prev) {
      // Rollback
      setStudents((list) => list.map((s) => (s.id === id ? prev : s)));
    }
  }

  return { students, loading, fetchStudents, updateStatus };
}
