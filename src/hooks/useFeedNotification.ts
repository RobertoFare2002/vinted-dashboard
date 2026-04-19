// src/hooks/useFeedNotification.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "feed_last_seen";

/**
 * Restituisce `hasUnread = true` quando esistono post nel feed
 * di altri utenti più recenti dell'ultima visita dell'utente.
 * Usa Supabase Realtime per notifiche live.
 * `markAsRead()` salva il timestamp corrente e azzera il badge.
 */
export function useFeedNotification() {
  const [hasUnread, setHasUnread] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    // ── Realtime: ascolta nuovi INSERT su feed_posts ──────────────────────
    const channel = supabase
      .channel("feed-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feed_posts" },
        (payload) => {
          // Ignora i propri post
          if (!mounted) return;
          if (payload.new.user_id !== userIdRef.current) {
            setHasUnread(true);
          }
        }
      )
      .subscribe();

    // ── Inizializzazione: controlla post non letti già esistenti ──────────
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      const userId = user?.id ?? null;
      userIdRef.current = userId;

      const lastSeen = localStorage.getItem(STORAGE_KEY);

      let q = supabase
        .from("feed_posts")
        .select("id", { count: "exact", head: true });

      // Escludi i propri post
      if (userId) q = q.neq("user_id", userId);
      // Considera solo quelli più recenti dell'ultima visita
      if (lastSeen) q = q.gt("created_at", lastSeen);

      q.then(({ count }) => {
        if (mounted && count && count > 0) setHasUnread(true);
      });
    });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  function markAsRead() {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setHasUnread(false);
  }

  return { hasUnread, markAsRead };
}
