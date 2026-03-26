// src/app/(dashboard)/stock/page.tsx
// SOSTITUISCE il file attuale

import { createClient } from "@/lib/supabase/server";
import StockClient from "@/components/StockClient";

type StockItem = {
  id:             string;
  name:           string | null;
  size:           string | null;
  quantity:       number | null;
  purchase_price: number | null;
  status:         string | null;
  purchased_at:   string | null;
  profile_id:     string | null;
  external_id:    string | null;
  location:       string | null;
  template_id_ext: string | null;
};

export default async function StockPage() {
  const supabase = await createClient();

  const [{ data: stockData }, { data: templatesData }] = await Promise.all([
    supabase
      .from("stock_log")
      .select("id,name,size,quantity,purchase_price,status,purchased_at,profile_id,external_id,location,template_id_ext")
      .order("purchased_at", { ascending: false }),
    supabase
      .from("templates")
      .select("id,name,photo_urls"),
  ]);

  const items     = (stockData     ?? []) as StockItem[];
  const templates = (templatesData ?? []) as { id: string; name: string; photo_urls: string[] | null }[];

  // Mappa template_id_ext → prima foto del template
  const photoMap: Record<string, string> = {};
  for (const tpl of templates) {
    if (Array.isArray(tpl.photo_urls) && tpl.photo_urls[0]) {
      photoMap[tpl.id] = tpl.photo_urls[0];
    }
  }

  // Nota: in StockClient, item.template_id_ext viene usato come chiave per photoMap

  const available = items.filter(i => i.status === "available").length;
  const sold      = items.filter(i => i.status === "sold").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Magazzino</h1>
          <p style={{ color: "rgba(255,255,255,.45)", fontSize: 13, margin: 0 }}>
            {available} disponibili · {sold} venduti · {items.length} totali
          </p>
        </div>
      </div>

      <StockClient initialItems={items} photoMap={photoMap} />
    </div>
  );
}
