// src/app/(dashboard)/sales/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── Tipi ────────────────────────────────────────────────────────────────────

export type SaleInput = {
  buyer_seller:     string;
  amount:           number;
  cost:             number;
  platform:         string;
  status:           string;
  notes:            string;
  transaction_date: string;
  template_id_ext:  string | null;
  profile_id:       string | null;
};

// ── Helper auth ──────────────────────────────────────────────────────────────

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Non autenticato.");
  return { supabase, user };
}

// ── CREATE ───────────────────────────────────────────────────────────────────

export async function createSale(input: SaleInput) {
  const { supabase, user } = await getAuthenticatedClient();

  const { error } = await supabase.from("sales_log").insert({
    user_id:          user.id,
    external_id:      crypto.randomUUID(),   // generato lato server — non viene dall'ext
    type:             "sale",
    buyer_seller:     input.buyer_seller.trim(),
    amount:           Number(input.amount)           || 0,
    cost:             Number(input.cost)             || 0,
    platform:         input.platform                 || "vinted",
    status:           input.status                   || "open",
    notes:            input.notes?.trim()            || null,
    transaction_date: input.transaction_date
      ? new Date(input.transaction_date).toISOString()
      : new Date().toISOString(),
    template_id_ext:  input.template_id_ext          || null,
    profile_id:       input.profile_id               || null,
    created_at:       new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/sales");
}

// ── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateSale(id: string, input: Partial<SaleInput>) {
  const { supabase, user } = await getAuthenticatedClient();

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.buyer_seller     !== undefined) patch.buyer_seller     = input.buyer_seller.trim();
  if (input.amount           !== undefined) patch.amount           = Number(input.amount) || 0;
  if (input.cost             !== undefined) patch.cost             = Number(input.cost)   || 0;
  if (input.platform         !== undefined) patch.platform         = input.platform;
  if (input.status           !== undefined) patch.status           = input.status;
  if (input.notes            !== undefined) patch.notes            = input.notes?.trim() || null;
  if (input.transaction_date !== undefined) patch.transaction_date = new Date(input.transaction_date).toISOString();
  if (input.template_id_ext  !== undefined) patch.template_id_ext  = input.template_id_ext || null;
  if (input.profile_id       !== undefined) patch.profile_id       = input.profile_id      || null;

  const { data: saleData, error } = await supabase
    .from("sales_log")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("raw_data, template_id_ext, status")
    .single();

  if (error) throw new Error(error.message);

  // Se lo status è cambiato, aggiorna anche il magazzino collegato
  if (input.status !== undefined && saleData) {
    const stockStatus = input.status === "open" ? "reserved"
                      : input.status === "closed" ? "sold"
                      : null;

    if (stockStatus) {
      const stockId = (saleData.raw_data as { stock_id?: string } | null)?.stock_id;

      if (stockId) {
        await supabase
          .from("stock_log")
          .update({ status: stockStatus, updated_at: new Date().toISOString() })
          .eq("id", stockId)
          .eq("user_id", user.id);
      } else if (saleData.template_id_ext) {
        await supabase
          .from("stock_log")
          .update({ status: stockStatus, updated_at: new Date().toISOString() })
          .eq("template_id_ext", saleData.template_id_ext)
          .eq("user_id", user.id);
        // Nessun filtro sullo status attuale — aggiorna sempre
      }

      revalidatePath("/stock");
    }
  }

  revalidatePath("/sales");
}

// ── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteSale(id: string) {
  const { supabase, user } = await getAuthenticatedClient();

  const { error } = await supabase
    .from("sales_log")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/sales");
}

// ── CHANGE STATUS — aggiorna vendita E magazzino collegato ───────────────────

export async function changeSaleStatus(id: string, status: "open" | "closed") {
  const { supabase, user } = await getAuthenticatedClient();

  // 1. Aggiorna stato vendita
  const { data: saleData, error: saleError } = await supabase
    .from("sales_log")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("raw_data, template_id_ext")
    .single();

  if (saleError) throw new Error(saleError.message);

  // 2. Aggiorna magazzino collegato (se esiste)
  const stockStatus = status === "open" ? "reserved" : "sold";

  // Collegamento diretto via stock_id
  const stockId = (saleData?.raw_data as { stock_id?: string } | null)?.stock_id;
  if (stockId) {
    await supabase
      .from("stock_log")
      .update({ status: stockStatus, updated_at: new Date().toISOString() })
      .eq("id", stockId)
      .eq("user_id", user.id);
  }

  // Fallback: collegamento via template_id_ext
  if (!stockId && saleData?.template_id_ext) {
    await supabase
      .from("stock_log")
      .update({ status: stockStatus, updated_at: new Date().toISOString() })
      .eq("template_id_ext", saleData.template_id_ext)
      .eq("user_id", user.id);
    // Nessun filtro sullo status attuale — aggiorna sempre
  }

  revalidatePath("/sales");
  revalidatePath("/stock");
}
