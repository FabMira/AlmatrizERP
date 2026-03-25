"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { createGenerationRepository } from "@/infrastructure/supabase/repositories/generation.repository";
import type { Generation } from "@/domain/students/types";

export function useGenerations() {
  const [generations, setGenerations] = useState<Generation[]>([]);

  const fetchGenerations = useCallback(async () => {
    const supabase = createClient();
    const repo = createGenerationRepository(supabase);
    try {
      const data = await repo.findAll();
      setGenerations(data);
    } catch {
      // leave previous state intact
    }
  }, []);

  useEffect(() => { fetchGenerations(); }, [fetchGenerations]);

  return { generations, fetchGenerations };
}
