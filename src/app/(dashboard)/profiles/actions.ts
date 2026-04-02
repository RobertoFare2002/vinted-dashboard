// src/app/(dashboard)/profiles/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Non autenticato.");
  return { supabase, user };
}

function extractVintedUserId(url: string): { userId: string | null; tld: string } {
  const tldMatch = url.match(/vinted\.([a-z]+)/i);
  const tld = tldMatch ? tldMatch[1] : "it";
  const numericMatch = url.match(/\/member\/(\d+)/);
  return { userId: numericMatch ? numericMatch[1] : null, tld };
}

/* ─────────────────────────────────────────────────────────────
   Step 1: ottieni un cookie di sessione anonima da Vinted
   Vinted richiede un cookie __cf_bm + _vinted_session per le API
───────────────────────────────────────────────────────────── */
async function getVintedSession(tld: string): Promise<string> {
  const res = await fetch(`https://www.vinted.${tld}/api/v2/sessions`, {
    method: "POST",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      "Content-Type": "application/json",
      Accept: "application/json",
      Referer: `https://www.vinted.${tld}/`,
      Origin: `https://www.vinted.${tld}`,
    },
    body: JSON.stringify({}),
    cache: "no-store",
  });

  const cookies = res.headers.get("set-cookie") ?? "";
  // Estrai _vinted_session cookie
  const sessionMatch = cookies.match(/_vinted_session=[^;]+/);
  return sessionMatch ? sessionMatch[0] : "";
}

/* ─────────────────────────────────────────────────────────────
   Step 2: chiama l'API con il cookie di sessione
───────────────────────────────────────────────────────────── */
async function fetchVintedUser(userId: string, tld: string) {
  // Prima ottieni la sessione
  const sessionCookie = await getVintedSession(tld);

  const res = await fetch(`https://www.vinted.${tld}/api/v2/users/${userId}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      Accept: "application/json",
      "Accept-Language": "it-IT,it;q=0.9",
      Referer: `https://www.vinted.${tld}/`,
      ...(sessionCookie ? { Cookie: sessionCookie } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    // Fallback: prova a leggere la pagina HTML del profilo
    return await scrapeVintedProfileHtml(userId, tld, sessionCookie);
  }

  const json = await res.json();
  const user = json?.user ?? null;
  if (!user) return null;

  // Se feedback_reputation è null, prova l'endpoint feedback
  if (user.feedback_reputation == null) {
    try {
      const feedbackRes = await fetch(
        `https://www.vinted.${tld}/api/v2/users/${userId}/feedback_summary`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
            Accept: "application/json",
            Referer: `https://www.vinted.${tld}/`,
            ...(sessionCookie ? { Cookie: sessionCookie } : {}),
          },
          cache: "no-store",
        }
      );
      if (feedbackRes.ok) {
        const feedbackJson = await feedbackRes.json();
        console.log("FEEDBACK SUMMARY:", JSON.stringify(feedbackJson, null, 2));
        // Prova vari campi possibili
        const rep =
          feedbackJson?.feedback_summary?.rating ??
          feedbackJson?.rating ??
          feedbackJson?.feedback_summary?.average_feedback_score ??
          feedbackJson?.average_feedback_score ??
          null;
        const count =
          feedbackJson?.feedback_summary?.total_count ??
          feedbackJson?.total_count ??
          feedbackJson?.feedback_summary?.count ??
          null;
        if (rep != null) user.feedback_reputation = rep / 5; // normalizza a 0-1
        if (count != null) user.positive_feedback_count = count;
      }
    } catch {
      // ignora errori feedback
    }
  }

  return user;
}

/* ─────────────────────────────────────────────────────────────
   Scraping rating dall'HTML della pagina profilo
───────────────────────────────────────────────────────────── */
async function scrapeRatingFromHtml(userId: string, tld: string, sessionCookie: string): Promise<{ rating: number | null; reviews_count: number | null }> {
  try {
    const res = await fetch(`https://www.vinted.${tld}/member/${userId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "it-IT,it;q=0.9",
        ...(sessionCookie ? { Cookie: sessionCookie } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) return { rating: null, reviews_count: null };

    const html = await res.text();

    // Cerca nel blocco __NEXT_DATA__
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        // Cerca ricorsivamente feedback_reputation
        const str = JSON.stringify(nextData);
        const repMatch = str.match(/"feedback_reputation"\s*:\s*([\d.]+)/);
        const countMatch = str.match(/"(?:positive_feedback_count|feedback_count)"\s*:\s*(\d+)/);
        const rep = repMatch ? parseFloat(repMatch[1]) : null;
        const count = countMatch ? parseInt(countMatch[1]) : null;
        if (rep != null && rep > 0) {
          return { rating: Math.round(rep * 5 * 10) / 10, reviews_count: count };
        }
      } catch { /* continua */ }
    }

    // Cerca nell'HTML direttamente pattern come "4.8" vicino a stelle
    const ratingPatterns = [
      /aria-label="([\d,\.]+)\s*(?:su|out of|von|sur)\s*5/i,
      /"rating"\s*:\s*([\d.]+)/,
      /class="[^"]*rating[^"]*"[^>]*>([\d,\.]+)</i,
      /<span[^>]*>([\d],[0-9])<\/span>\s*\/\s*5/,
    ];
    for (const pattern of ratingPatterns) {
      const m = html.match(pattern);
      if (m) {
        const val = parseFloat(m[1].replace(",", "."));
        if (val > 0 && val <= 5) {
          return { rating: val, reviews_count: null };
        }
      }
    }
  } catch { /* ignora */ }

  return { rating: null, reviews_count: null };
}
async function scrapeVintedProfileHtml(userId: string, tld: string, sessionCookie: string) {
  const res = await fetch(`https://www.vinted.${tld}/member/${userId}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "it-IT,it;q=0.9",
      ...(sessionCookie ? { Cookie: sessionCookie } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `Impossibile accedere al profilo Vinted (HTTP ${res.status}). Vinted potrebbe aver bloccato la richiesta.`
    );
  }

  const html = await res.text();

  // Cerca il blocco __NEXT_DATA__
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const u =
        nextData?.props?.pageProps?.user ??
        nextData?.props?.pageProps?.profile;
      if (u) return u;
    } catch {
      // continua
    }
  }

  // Fallback meta tag
  const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/)?.[1];
  const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)?.[1];

  if (ogTitle) {
    const name = ogTitle.replace(/\s*[|\-].*$/g, "").trim();
    return {
      login: name,
      photo: ogImage ? { url: ogImage } : null,
      feedback_reputation: null,
      positive_feedback_count: null,
    };
  }

  throw new Error(
    "Profilo trovato ma impossibile leggere i dati. Prova a copiare l'URL direttamente dalla pagina del profilo Vinted."
  );
}

/* ─────────────────────────────────────────────────────────────
   Crea un profilo importando i dati da Vinted
───────────────────────────────────────────────────────────── */
export async function createProfileFromVinted(vintedUrl: string, manualRating?: number | null) {
  const { supabase, user } = await getAuthenticatedClient();

  const { userId, tld } = extractVintedUserId(vintedUrl);

  if (!userId) {
    throw new Error(
      "Impossibile trovare l'ID numerico nell'URL. Usa un formato come: https://www.vinted.it/member/71045655"
    );
  }

  const vintedUser = await fetchVintedUser(userId, tld);

  if (!vintedUser) {
    throw new Error("Profilo Vinted non trovato. Controlla che l'URL sia corretto.");
  }

  const name: string = vintedUser.login ?? vintedUser.real_name ?? `Utente ${userId}`;
  const avatar_url: string | null =
    vintedUser.photo?.url ??
    vintedUser.photo?.full_size_url ??
    vintedUser.photo?.medium_url ??
    null;

  // Prova prima dall'API, poi scraping HTML
  let rating: number | null = null;
  let reviews_count: number | null = null;

  // Usa rating manuale se fornito, altrimenti prova scraping
  if (manualRating != null) {
    rating = manualRating;
  } else if (vintedUser.feedback_reputation != null) {
    rating = Math.round(Number(vintedUser.feedback_reputation) * 5 * 10) / 10;
    reviews_count = vintedUser.positive_feedback_count ?? vintedUser.feedback_count ?? null;
  } else {
    const sessionCookie = await getVintedSession(tld);
    const scraped = await scrapeRatingFromHtml(userId, tld, sessionCookie);
    rating = scraped.rating;
    reviews_count = scraped.reviews_count ?? vintedUser.positive_feedback_count ?? null;
  }

  console.log(`Profilo: ${name}, rating: ${rating}, reviews: ${reviews_count}`);

  // Prova prima con tutti i campi, poi fallback ai campi base
  const { error } = await supabase.from("profiles").insert({
    user_id: user.id,
    name,
    avatar_url,
    vinted_url: vintedUrl,
    vinted_user_id: userId,
    rating,
    reviews_count,
  });

  if (error) {
    if (error.message.includes("column") || error.message.includes("does not exist")) {
      const { error: error2 } = await supabase.from("profiles").insert({
        user_id: user.id,
        name,
        avatar_url,
      });
      if (error2) throw new Error(error2.message);
    } else {
      throw new Error(error.message);
    }
  }

  revalidatePath("/");
  revalidatePath("/sales");
  revalidatePath("/stock");
}

/* ─────────────────────────────────────────────────────────────
   Aggiorna solo il rating di un profilo
───────────────────────────────────────────────────────────── */
export async function updateProfileRating(profileId: string, rating: number) {
  const { supabase, user } = await getAuthenticatedClient();

  const { error } = await supabase
    .from("profiles")
    .update({ rating })
    .eq("id", profileId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
}

/* ─────────────────────────────────────────────────────────────
   Elimina un profilo
───────────────────────────────────────────────────────────── */
export async function deleteProfile(profileId: string) {
  const { supabase, user } = await getAuthenticatedClient();

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", profileId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/sales");
  revalidatePath("/stock");
}

/* ─────────────────────────────────────────────────────────────
   Aggiorna un profilo (retrocompatibilità)
───────────────────────────────────────────────────────────── */
export async function updateProfile(
  profileId: string,
  input: { name?: string; avatar_url?: string }
) {
  const { supabase, user } = await getAuthenticatedClient();

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.avatar_url !== undefined) patch.avatar_url = input.avatar_url.trim() || null;
  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", profileId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/sales");
  revalidatePath("/stock");
}

/* ─────────────────────────────────────────────────────────────
   Upload avatar (retrocompatibilità)
───────────────────────────────────────────────────────────── */
export async function uploadProfileAvatar(profileId: string, formData: FormData) {
  const { supabase, user } = await getAuthenticatedClient();

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Nessun file selezionato.");

  const ext = file.name.split(".").pop() || "jpg";
  const path = `avatars/${user.id}/${profileId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-avatars")
    .upload(path, file, { upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = supabase.storage
    .from("profile-avatars")
    .getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: urlData.publicUrl })
    .eq("id", profileId)
    .eq("user_id", user.id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/");
  revalidatePath("/sales");
  revalidatePath("/stock");

  return urlData.publicUrl;
}
