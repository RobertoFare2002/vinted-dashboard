// src/app/(dashboard)/stock/page.tsx
import { createClient } from "@/lib/supabase/server";
import StockClient from "@/components/StockClient";

export const revalidate = 0;

type StockItem = {
  id:              string;
  name:            string | null;
  size:            string | null;
  quantity:        number | null;
  purchase_price:  number | null;
  status:          string | null;
  purchased_at:    string | null;
  profile_id:      string | null;
  external_id:     string | null;
  location:        string | null;
  template_id_ext: string | null;
};

type SaleRow = {
  id:              string;
  status:          string | null;
  template_id_ext: string | null;
  raw_data:        { stock_id?: string } | null;
};

// stato vendita → stato magazzino atteso
const SALE_TO_STOCK: Record<string, string> = {
  open:   "reserved",
  closed: "sold",
};

export default async function StockPage() {
  const supabase = await createClient();

  const [{ data: stockData }, { data: templatesData }, { data: salesData }, { data: profilesData }] =
    await Promise.all([
      supabase
        .from("stock_log")
        .select("id,name,size,quantity,purchase_price,status,purchased_at,profile_id,external_id,location,template_id_ext")
        .order("purchased_at", { ascending: false }),
      supabase
        .from("templates")
        .select("id,name,photo_urls"),
      supabase
        .from("sales_log")
        .select("id,status,template_id_ext,raw_data"),
      supabase
        .from("profiles")
        .select("id,name"),
    ]);

  let items       = (stockData     ?? []) as StockItem[];
  const templates = (templatesData ?? []) as { id: string; name: string; photo_urls: string[] | null }[];
  const sales     = (salesData     ?? []) as SaleRow[];
  const profiles  = (profilesData  ?? []) as { id: string; name: string }[];

  // Mappa profile_id → nome
  const profileMap: Record<string, string> = {};
  for (const p of profiles) profileMap[p.id] = p.name;

  // ── Riconciliazione stato ────────────────────────────────────────────────
  //
  // Strategia a due livelli:
  // 1. Collegamento diretto:  sale.raw_data.stock_id === stock.id
  //    (vendite create dal nuovo flusso "Vendi" dal magazzino)
  // 2. Collegamento template: sale.template_id_ext === stock.template_id_ext
  //    (vendite sincronizzate dall'estensione, senza stock_id)
  //    "sold" vince sempre su "reserved"

  // Mappa 1: stock_id diretto → stato atteso
  const byStockId: Record<string, string> = {};
  for (const sale of sales) {
    const stockId = sale.raw_data?.stock_id;
    if (!stockId || !sale.status) continue;
    const expected = SALE_TO_STOCK[sale.status];
    if (!expected) continue;
    // "sold" vince sempre su "reserved"
    if (byStockId[stockId] === "sold") continue;
    byStockId[stockId] = expected;
  }

  // Mappa 2: template_id_ext → stato atteso
  // "sold" (closed) vince sempre su "reserved" (open)
  const byTemplateId: Record<string, string> = {};
  for (const sale of sales) {
    if (!sale.template_id_ext || !sale.status) continue;
    if (sale.raw_data?.stock_id) continue; // già gestito dal collegamento diretto
    const expected = SALE_TO_STOCK[sale.status];
    if (!expected) continue;
    if (byTemplateId[sale.template_id_ext] === "sold") continue; // sold non si sovrascrive
    byTemplateId[sale.template_id_ext] = expected;
  }

  // Applica la riconciliazione
  const toFix: { id: string; newStatus: string }[] = [];

  items = items.map(item => {
    // Prima controlla collegamento diretto
    let expected = byStockId[item.id];

    // Fallback: collegamento tramite template_id_ext
    // Applicato se l'articolo non è già "sold" (non sovrascrivere stati definitivi)
    if (!expected && item.template_id_ext && item.status !== "sold") {
      expected = byTemplateId[item.template_id_ext];
    }

    if (expected && item.status !== expected) {
      toFix.push({ id: item.id, newStatus: expected });
      return { ...item, status: expected };
    }
    return item;
  });

  // Aggiorna Supabase in background per i record inconsistenti
  if (toFix.length > 0) {
    for (const { id, newStatus } of toFix) {
      void Promise.resolve(
        supabase
          .from("stock_log")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", id)
      ).catch(() => {});
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  // Mappa template_id_ext → prima foto
  const photoMap: Record<string, string> = {};
  for (const tpl of templates) {
    if (Array.isArray(tpl.photo_urls) && tpl.photo_urls[0]) {
      photoMap[tpl.id] = tpl.photo_urls[0];
    }
  }

  const availableItems = items.filter(i => i.status === "available");

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, color: "#111111", letterSpacing: "-.03em" }}>Magazzino</h1>
        <p style={{ color: "#888888", fontSize: 13, margin: 0 }}>
          {availableItems.length} articoli disponibili
        </p>
      </div>
      <StockClient initialItems={availableItems} photoMap={photoMap} profileMap={profileMap} profiles={profiles} />
    </div>
  );
}
