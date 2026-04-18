// src/app/(dashboard)/sales/page.tsx
// SOSTITUISCE il file attuale — mantiene lo stesso stile visivo, aggiunge CRUD completo

import { createClient } from "@/lib/supabase/server";
import SalesClient from "@/components/SalesClient";

export const revalidate = 0; // disabilita cache Next.js

export default async function SalesPage() {
  const supabase = await createClient();

  const [{ data: salesData }, { data: templatesData }, { data: profilesData }] = await Promise.all([
    supabase
      .from("sales_log")
      .select("id,user_id,buyer_seller,amount,cost,platform,status,notes,transaction_date,template_id_ext,profile_id,raw_data")
      .order("transaction_date", { ascending: false }),
    supabase
      .from("templates")
      .select("id,name,photo_urls")
      .order("name", { ascending: true }),
    supabase
      .from("profiles")
      .select("id,name"),
  ]);

  const sales     = (salesData     ?? []) as SaleRow[];
  const templates = (templatesData ?? []) as TemplateMin[];
  const profiles  = (profilesData  ?? []) as { id: string; name: string }[];

  // Mappa profile_id → nome profilo
  const profileMap: Record<string, string> = {};
  for (const p of profiles) {
    profileMap[p.id] = p.name;
  }

  // Mappa template_id → prima foto
  const photoMap: Record<string, string> = {};
  for (const tpl of templates) {
    if (Array.isArray(tpl.photo_urls) && tpl.photo_urls[0]) {
      photoMap[tpl.id] = tpl.photo_urls[0];
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, color: "var(--ink)", letterSpacing: "-.03em" }}>Vendite</h1>
      </div>

      <SalesClient
        initialSales={sales}
        templates={templates.map(t => ({ id: t.id, name: t.name }))}
        photoMap={photoMap}
        profileMap={profileMap}
        profiles={profiles}
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
