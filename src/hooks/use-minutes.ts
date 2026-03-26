"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { createMinuteRepository } from "@/infrastructure/supabase/repositories/minute.repository";
import { deleteMinuteAction } from "@/actions/minute.actions";
import { useRealtime } from "./use-realtime";
import type { MeetingMinute } from "@/domain/minutes/types";

export function useMinutes() {
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMinutes = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const repo = createMinuteRepository(supabase);
    try {
      const data = await repo.findAll();
      setMinutes(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMinutes(); }, [fetchMinutes]);
  useRealtime("meeting_minutes", fetchMinutes);

  async function deleteMinute(id: string) {
    const snapshot = minutes.find((m) => m.id === id);
    setMinutes((prev) => prev.filter((m) => m.id !== id));
    const result = await deleteMinuteAction(id);
    if (result.error && snapshot) {
      setMinutes((prev) => [snapshot, ...prev]);
    }
  }

  return { minutes, loading, fetchMinutes, deleteMinute };
}
