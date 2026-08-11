"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

// Debounce refreshes — if many changes arrive at once (e.g. bulk insert),
// we only refresh once per 500ms window to avoid hammering the server.
export function useRealtimeRefresh() {
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const sb = supabase;

    const channel = sb
      .channel("karshani-crm-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload: { table: string; eventType: string }) => {
          // Any change to any table → schedule a debounced refresh
          console.debug("[realtime] change:", payload.table, payload.eventType);
          if (refreshTimer.current) clearTimeout(refreshTimer.current);
          refreshTimer.current = setTimeout(() => {
            router.refresh();
          }, 500);
        }
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          console.debug("[realtime] subscribed to DB changes");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[realtime] subscription issue:", status);
        }
      });

    return () => {
      sb.removeChannel(channel);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [router]);
}
