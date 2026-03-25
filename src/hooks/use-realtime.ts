"use client";

import { useCallback, useEffect, useRef } from "react";
import { createClient } from "@/infrastructure/supabase/client";

export function useRealtime(table: string, onUpdate: () => void) {
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`${table}-realtime`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => onUpdateRef.current()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [table]);
}
