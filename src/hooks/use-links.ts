"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { createLinkRepository } from "@/infrastructure/supabase/repositories/link.repository";
import { useRealtime } from "./use-realtime";
import type { Link } from "@/domain/links/types";

export function useLinks() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const repo = createLinkRepository(supabase);
    try {
      const data = await repo.findAll();
      setLinks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);
  useRealtime("links", fetchLinks);

  return { links, loading, fetchLinks };
}
