"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/infrastructure/supabase/client";

export function useProfiles() {
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase.from("profiles").select("id, full_name").then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        for (const p of data) map[p.id] = p.full_name ?? p.id.slice(0, 8) + "\u2026";
        setProfilesMap(map);
      }
    });
  }, []);

  return { profilesMap };
}
