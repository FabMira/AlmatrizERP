"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { createAreaRepository } from "@/infrastructure/supabase/repositories/area.repository";
import type { Area } from "@/domain/shared/types";

export function useAreas() {
  const [areas, setAreas] = useState<Area[]>([]);

  const fetchAreas = useCallback(async () => {
    const supabase = createClient();
    const repo = createAreaRepository(supabase);
    try {
      const data = await repo.findAll();
      setAreas(data);
    } catch {
      // leave previous state intact
    }
  }, []);

  useEffect(() => { fetchAreas(); }, [fetchAreas]);

  return { areas };
}
