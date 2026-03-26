// src/app/(dashboard)/stock/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Non autenticato.");
  return { supabase, user };
}

// ── VENDI articolo dal magazzino ─────────────────────────────────────────────
// 1. Aggiorna stock_log status → "sold"
// 2. Inserisce riga in sales_log
// Tutto in sequenza — se uno fallisce l'altro non viene eseguito

export async function sellStockItem(input: {
  stockId:      string;
  stockName:    string;
  purchasePrice: number;
  externalId:   string;   // template_id_ext per il collegamento
  profileId:    string | null;
  // Dati vendita
  salePrice:    number;
  buyerSeller:  string;
  saleDate:     string;
  notes:        string;
  platform:     string;
}) {
  const { supabase, user } = await getAuthenticatedClient();

  // Step 1: marca il pezzo come venduto nel magazzino
  const { error: stockError } = await supabase
    .from("stock_log")
    .update({
      status:     "sold",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.stockId)
    .eq("user_id", user.id);

  if (stockError) throw new Error("Errore aggiornamento magazzino: " + stockError.message);

  // Step 2: crea la vendita in sales_log
  const { data: saleData, error: saleError } = await supabase
    .from("sales_log")
    .insert({
      user_id:          user.id,
      external_id:      crypto.randomUUID(),
      type:             "sale",
      buyer_seller:     input.buyerSeller.trim() || input.stockName,
      amount:           Number(input.salePrice)   || 0,
      cost:             Number(input.purchasePrice) || 0,
      platform:         input.platform             || "vinted",
      status:           "closed",
      notes:            input.notes?.trim()        || null,
      transaction_date: input.saleDate
        ? new Date(input.saleDate).toISOString()
        : new Date().toISOString(),
      template_id_ext:  input.externalId           || null,
      profile_id:       input.profileId            || null,
      // Salva il riferimento allo stock_id per poter annullare
      raw_data:         JSON.stringify({ stock_id: input.stockId }),
      created_at:       new Date().toISOString(),
      updated_at:       new Date().toISOString(),
    })
    .select("id")
    .single();

  if (saleError) {
    // Rollback manuale: rimetti lo stock disponibile
    await supabase
      .from("stock_log")
      .update({ status: "available", updated_at: new Date().toISOString() })
      .eq("id", input.stockId)
      .eq("user_id", user.id);
    throw new Error("Errore creazione vendita: " + saleError.message);
  }

  revalidatePath("/stock");
  revalidatePath("/sales");

  return { saleId: saleData.id };
}

// ── ANNULLA vendita → ripristina magazzino ───────────────────────────────────

export async function cancelSale(input: {
  saleId:   string;
  stockId:  string;
}) {
  const { supabase, user } = await getAuthenticatedClient();

  // Step 1: elimina la vendita
  const { error: deleteError } = await supabase
    .from("sales_log")
    .delete()
    .eq("id", input.saleId)
    .eq("user_id", user.id);

  if (deleteError) throw new Error("Errore eliminazione vendita: " + deleteError.message);

  // Step 2: rimetti l'articolo disponibile nel magazzino
  const { error: stockError } = await supabase
    .from("stock_log")
    .update({
      status:     "available",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.stockId)
    .eq("user_id", user.id);

  if (stockError) throw new Error("Errore ripristino magazzino: " + stockError.message);

  revalidatePath("/stock");
  revalidatePath("/sales");
}

// ── DELETE articolo magazzino ────────────────────────────────────────────────

export async function deleteStockItem(stockId: string) {
  const { supabase, user } = await getAuthenticatedClient();

  const { error } = await supabase
    .from("stock_log")
    .delete()
    .eq("id", stockId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/stock");
}
