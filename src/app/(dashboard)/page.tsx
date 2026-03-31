// src/app/(dashboard)/page.tsx
import { createClient } from "@/lib/supabase/server";
import DashboardCharts from "@/components/DashboardCharts";

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: salesData }, { data: stockData }, { data: profilesData }] = await Promise.all([
    supabase.from("sales_log").select("*").order("transaction_date", { ascending: false }),
    supabase.from("stock_log").select("*").order("purchased_at", { ascending: false }),
    supabase.from("profiles").select("id,name"),
  ]);

  const sales    = (salesData    ?? []) as any[];
  const stock    = (stockData    ?? []) as any[];
  const profiles = (profilesData ?? []) as { id: string; name: string }[];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Dashboard</h1>
        <p style={{ color: "rgba(255,255,255,.45)", fontSize: 13 }}>
          Aggiornata in tempo reale dall&apos;estensione
        </p>
      </div>
      <DashboardCharts sales={sales} stock={stock} profiles={profiles} />
    </div>
  );
}
