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
// 1. Aggiorna stock_log status → "reserved" (in sospeso, non ancora concluso)
// 2. Inserisce riga in sales_log con status "open"
// Quando la vendita viene conclusa → stock diventa "sold"
// Quando la vendita viene annullata → stock torna "available"

export async function sellStockItem(input: {
  stockId:      string;
  stockName:    string;
  purchasePrice: number;
  externalId:   string;
  profileId:    string | null;
  salePrice:    number;
  buyerSeller:  string;
  saleDate:     string;
  notes:        string;
  platform:     string;
}) {
  const { supabase, user } = await getAuthenticatedClient();

  // Step 1: marca il pezzo come "reserved" (vendita in sospeso)
  const { error: stockError } = await supabase
    .from("stock_log")
    .update({
      status:     "reserved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.stockId)
    .eq("user_id", user.id);

  if (stockError) throw new Error("Errore aggiornamento magazzino: " + stockError.message);

  // Step 2: crea la vendita con status "open" (in sospeso)
  const { data: saleData, error: saleError } = await supabase
    .from("sales_log")
    .insert({
      user_id:          user.id,
      external_id:      crypto.randomUUID(),
      type:             "sale",
      buyer_seller:     input.buyerSeller.trim() || input.stockName,
      amount:           Number(input.salePrice)    || 0,
      cost:             Number(input.purchasePrice) || 0,
      platform:         input.platform              || "vinted",
      status:           "open",   // ← in sospeso finché non si conclude
      notes:            input.notes?.trim()         || null,
      transaction_date: input.saleDate
        ? new Date(input.saleDate).toISOString()
        : new Date().toISOString(),
      template_id_ext:  input.externalId            || null,
      profile_id:       input.profileId             || null,
      raw_data:         JSON.stringify({ stock_id: input.stockId }),
      created_at:       new Date().toISOString(),
      updated_at:       new Date().toISOString(),
    })
    .select("id")
    .single();

  if (saleError) {
    // Rollback: rimetti lo stock disponibile
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

// ── CONCLUDI vendita → stock diventa sold ────────────────────────────────────

export async function concludeSale(input: {
  saleId:  string;
  stockId: string;
}) {
  const { supabase, user } = await getAuthenticatedClient();

  // Step 1: vendita → closed
  const { error: saleError } = await supabase
    .from("sales_log")
    .update({
      status:     "closed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.saleId)
    .eq("user_id", user.id);

  if (saleError) throw new Error("Errore conclusione vendita: " + saleError.message);

  // Step 2: stock → sold
  const { error: stockError } = await supabase
    .from("stock_log")
    .update({
      status:     "sold",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.stockId)
    .eq("user_id", user.id);

  if (stockError) throw new Error("Errore aggiornamento magazzino: " + stockError.message);

  revalidatePath("/stock");
  revalidatePath("/sales");
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

// ── UPDATE articolo magazzino ────────────────────────────────────────────────

export async function updateStockItem(id: string, input: {
  name:           string;
  size:           string;
  quantity:       number;
  purchase_price: number | null;
  purchased_at:   string | null;
  notes:          string;
  status:         string;
  profile_id:     string | null;
}) {
  const { supabase, user } = await getAuthenticatedClient();

  const { error } = await supabase
    .from("stock_log")
    .update({
      name:           input.name.trim(),
      size:           input.size.trim(),
      quantity:       input.quantity,
      purchase_price: input.purchase_price,
      purchased_at:   input.purchased_at || null,
      notes:          input.notes.trim()    || null,
      status:         input.status,
      profile_id:     input.profile_id      || null,
      updated_at:     new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/stock");
}

// ── VENDI A BLOCCO più articoli ──────────────────────────────────────────────

export async function bulkSellStockItems(input: {
  items: {
    stockId:       string;
    stockName:     string;
    purchasePrice: number;
    externalId:    string;
    profileId:     string | null;
    salePrice:     number;
  }[];
  buyerSeller: string;
  saleDate:    string;
  platform:    string;
  notes:       string;
  profileId:   string | null;
}) {
  const { supabase, user } = await getAuthenticatedClient();
  const bulkId   = crypto.randomUUID();
  const bulkSize = input.items.length;

  for (const item of input.items) {
    const { error: stockError } = await supabase
      .from("stock_log")
      .update({ status: "reserved", updated_at: new Date().toISOString() })
      .eq("id", item.stockId)
      .eq("user_id", user.id);

    if (stockError) throw new Error("Errore magazzino: " + stockError.message);

    const { error: saleError } = await supabase
      .from("sales_log")
      .insert({
        user_id:          user.id,
        external_id:      crypto.randomUUID(),
        type:             "sale",
        buyer_seller:     input.buyerSeller.trim() || item.stockName,
        amount:           Number(item.salePrice)    || 0,
        cost:             Number(item.purchasePrice) || 0,
        platform:         input.platform             || "vinted",
        status:           "open",
        notes:            input.notes?.trim()        || null,
        transaction_date: input.saleDate
          ? new Date(input.saleDate).toISOString()
          : new Date().toISOString(),
        template_id_ext:  item.externalId  || null,
        profile_id:       input.profileId  || item.profileId || null,
        raw_data:         JSON.stringify({
          stock_id:   item.stockId,
          bulk_id:    bulkId,
          bulk_size:  bulkSize,
        }),
        created_at:  new Date().toISOString(),
        updated_at:  new Date().toISOString(),
      });

    if (saleError) throw new Error("Errore creazione vendita: " + saleError.message);
  }

  revalidatePath("/stock");
  revalidatePath("/sales");
}
