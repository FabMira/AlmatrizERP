"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { createProfileRepository } from "@/infrastructure/supabase/repositories/profile.repository";
import type { Profile } from "@/domain/shared/types";

export function useProfiles() {
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const repo = createProfileRepository(supabase);
    repo.findAll().then((data) => {
      setProfiles(data);
      const map: Record<string, string> = {};
      for (const p of data) map[p.id] = p.full_name ?? p.id.slice(0, 8) + "…";
      setProfilesMap(map);
    });
  }, []);

  const nonAdminProfiles = profiles.filter((p) => p.role !== "admin");

  return { profilesMap, profiles, nonAdminProfiles };
}
