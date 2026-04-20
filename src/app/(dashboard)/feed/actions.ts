// src/app/(dashboard)/feed/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autenticato.");
  return { supabase, user };
}

// ── Pubblica un post nel feed ─────────────────────────────────────────────────

export async function createFeedPost(input: {
  saleName:     string;
  saleAmount:   number;
  saleCost:     number;
  salePlatform: string;
  saleSize:     string;
  photoUrl:     string;
  caption:      string;
}) {
  const { supabase, user } = await getAuth();

  // Ricava nome e avatar dall'utente autenticato
  const meta        = user.user_metadata ?? {};
  const authorName  = meta.full_name || meta.name || meta.display_name
    || user.email?.split("@")[0] || "Utente";
  const authorAvatar = meta.avatar_url || meta.picture || null;

  const { error } = await supabase.from("feed_posts").insert({
    user_id:        user.id,
    author_name:    authorName,
    author_avatar:  authorAvatar,
    sale_name:      input.saleName.trim()     || null,
    sale_amount:    Number(input.saleAmount)  || 0,
    sale_cost:      Number(input.saleCost)    || 0,
    sale_platform:  input.salePlatform        || null,
    sale_size:      input.saleSize.trim()     || null,
    photo_url:      input.photoUrl.trim()     || null,
    caption:        input.caption.trim()      || null,
    created_at:     new Date().toISOString(),
  });

  if (error) throw new Error("Errore pubblicazione: " + error.message);
  revalidatePath("/feed");
}

// ── Toglie/mette like a un post ───────────────────────────────────────────────

export async function toggleLike(postId: string): Promise<{ liked: boolean; count: number }> {
  const { supabase, user } = await getAuth();

  const { data: existing } = await supabase
    .from("feed_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("feed_likes").delete().eq("id", existing.id);
  } else {
    await supabase.from("feed_likes").insert({ post_id: postId, user_id: user.id });
  }

  const { count } = await supabase
    .from("feed_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  return { liked: !existing, count: count ?? 0 };
}

// ── Elimina un post (solo il proprietario) ────────────────────────────────────

export async function deleteFeedPost(postId: string) {
  const { supabase, user } = await getAuth();
  const { error } = await supabase
    .from("feed_posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/feed");
}
