"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { createAccountingRepository } from "@/infrastructure/supabase/repositories/accounting.repository";
import { getSectionBySlug } from "@/domain/accounting/helpers";
import { useRealtime } from "./use-realtime";

export function useAccounting(section: string) {
  const config = getSectionBySlug(section);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    if (!config) return;

    const supabase = createClient();
    const repo = createAccountingRepository(supabase);

    const filters: Record<string, string> = {};
    if (config.programFilter) {
      filters.programa = config.programFilter;
    }

    try {
      const data = await repo.findAll(config.table, {
        orderBy: config.defaultOrder,
        ascending: false,
        filters,
      });
      setRecords(data);
    } catch {
      // silently ignore fetch errors (e.g. network / RLS)
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    setLoading(true);
    fetchRecords();
  }, [fetchRecords]);

  useRealtime(config?.table ?? "acc_journal", fetchRecords);

  return { records, loading, fetchRecords };
}
