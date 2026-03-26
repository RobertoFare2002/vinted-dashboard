// src/app/(dashboard)/sales/page.tsx
// SOSTITUISCE il file attuale — mantiene lo stesso stile visivo, aggiunge CRUD completo

import { createClient } from "@/lib/supabase/server";
import SalesClient from "@/components/SalesClient";

export default async function SalesPage() {
  const supabase = await createClient();

  const [{ data: salesData }, { data: templatesData }] = await Promise.all([
    supabase
      .from("sales_log")
      .select("id,user_id,buyer_seller,amount,cost,platform,status,notes,transaction_date,template_id_ext,profile_id,raw_data")
      .order("transaction_date", { ascending: false }),
    supabase
      .from("templates")
      .select("id,name,photo_urls")
      .order("name", { ascending: true }),
  ]);

  const sales     = (salesData     ?? []) as SaleRow[];
  const templates = (templatesData ?? []) as TemplateMin[];

  // Mappa template_id → prima foto (per thumbnail in tabella)
  const photoMap: Record<string, string> = {};
  for (const tpl of templates) {
    if (Array.isArray(tpl.photo_urls) && tpl.photo_urls[0]) {
      photoMap[tpl.id] = tpl.photo_urls[0];
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Vendite</h1>
          <p style={{ color: "rgba(255,255,255,.45)", fontSize: 13, margin: 0 }}>
            {sales.length} vendite totali · gestisci dal sito
          </p>
        </div>
      </div>

      {/* Tutta la logica interattiva è nel client component */}
      <SalesClient
        initialSales={sales}
        templates={templates.map(t => ({ id: t.id, name: t.name }))}
        photoMap={photoMap}
      />
    </div>
  );
}

// ── Tipi locali ───────────────────────────────────────────────────────────────

type SaleRow = {
  id:               string;
  buyer_seller:     string | null;
  amount:           number | null;
  cost:             number | null;
  platform:         string | null;
  status:           string | null;
  notes:            string | null;
  transaction_date: string | null;
  template_id_ext:  string | null;
  profile_id:       string | null;
  raw_data:         { stock_id?: string } | null;
};

type TemplateMin = {
  id:         string;
  name:       string;
  photo_urls: string[] | null;
};
