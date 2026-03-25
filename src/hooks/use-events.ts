"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { createEventRepository } from "@/infrastructure/supabase/repositories/event.repository";
import { useRealtime } from "./use-realtime";
import type { CalendarEvent } from "@/domain/calendar/types";

export function useEvents(viewYear: number, viewMonth: number) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const repo = createEventRepository(supabase);
    try {
      const data = await repo.findByMonth(viewYear, viewMonth);
      setEvents(data);
    } finally {
      setLoading(false);
    }
  }, [viewYear, viewMonth]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useRealtime("events", fetchEvents);

  return { events, loading, fetchEvents };
}
