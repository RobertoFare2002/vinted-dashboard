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
  const nowTs    = Date.now();

  // Mappa UUID profilo → nome
  const profileNamesMap: Record<string, string> = {};
  for (const p of profiles) profileNamesMap[p.id] = p.name;

  const closed = sales.filter((s: any) => s.status === "closed");
  const open   = sales.filter((s: any) => s.status === "open");

  const totalRevenue = closed.reduce((s: number, x: any) => s + Number(x.amount ?? 0), 0);
  const totalCost    = sales.reduce((s: number, x: any) => s + Number(x.cost ?? 0), 0);
  const totalPending = open.reduce((s: number, x: any) => s + Number(x.amount ?? 0), 0);
  const profit       = totalRevenue - totalCost;
  const avgMargin    = totalCost > 0 ? Math.round(((totalRevenue - totalCost) / totalCost) * 100) : 0;

  const staleItems = stock.filter((i: any) => {
    if (!i.purchased_at) return false;
    return Math.floor((nowTs - new Date(i.purchased_at).getTime()) / 86400000) > 60;
  }).length;

  type MonthEntry = { revenue: number; cost: number; count: number; total: number };
  const monthMap: Record<string, MonthEntry> = {};
  for (const s of sales) {
    const m = String(s.transaction_date ?? "").slice(0, 7);
    if (!m) continue;
    if (!monthMap[m]) monthMap[m] = { revenue: 0, cost: 0, count: 0, total: 0 };
    if (s.status === "closed") monthMap[m].revenue += Number(s.amount ?? 0);
    monthMap[m].total += Number(s.amount ?? 0);
    monthMap[m].cost  += Number(s.cost ?? 0);
    monthMap[m].count += 1;
  }

  const revenueByMonth = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([month, v]) => ({
      month:    new Date(month + "-01").toLocaleDateString("it", { month: "short", year: "2-digit" }),
      ricavi:   +v.revenue.toFixed(2),
      costi:    +v.cost.toFixed(2),
      totale:   +v.total.toFixed(2),
      profitto: +(v.revenue - v.cost).toFixed(2),
      vendite:  v.count,
    }));

  const productMap: Record<string, { name: string; revenue: number; cost: number; count: number }> = {};
  for (const s of closed) {
    const key = String(s.buyer_seller || "Sconosciuto").trim();
    if (!productMap[key]) productMap[key] = { name: key, revenue: 0, cost: 0, count: 0 };
    productMap[key].revenue += Number(s.amount ?? 0);
    productMap[key].cost    += Number(s.cost   ?? 0);
    productMap[key].count   += 1;
  }

  const topProducts = Object.values(productMap)
    .sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost))
    .slice(0, 8)
    .map(p => ({
      name:     p.name.length > 22 ? p.name.slice(0, 22) + "…" : p.name,
      profitto: +(p.revenue - p.cost).toFixed(2),
      margine:  p.cost > 0 ? Math.round(((p.revenue - p.cost) / p.cost) * 100) : 0,
    }));

  // ── Vendite per profilo con nomi risolti ─────────────────────────────────
  const profileRevenueMap: Record<string, { revenue: number; count: number }> = {};
  for (const s of closed) {
    const pid  = String(s.profile_id || "Nessuno");
    const name = profileNamesMap[pid] ?? pid; // risolvi UUID → nome
    if (!profileRevenueMap[name]) profileRevenueMap[name] = { revenue: 0, count: 0 };
    profileRevenueMap[name].revenue += Number(s.amount ?? 0);
    profileRevenueMap[name].count   += 1;
  }

  const byProfile = Object.entries(profileRevenueMap)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .map(([name, v]) => ({
      name:    name,
      ricavi:  +v.revenue.toFixed(2),
      vendite: v.count,
    }));

  const staleStock = stock
    .filter((i: any) => i.purchased_at && i.status === "available")
    .map((i: any) => ({
      name:    String(i.name || "—").slice(0, 28),
      days:    Math.floor((nowTs - new Date(i.purchased_at).getTime()) / 86400000),
      cost:    Number(i.purchase_price ?? 0),
      profile: profileNamesMap[i.profile_id] ?? String(i.profile_id || "—").slice(0, 12),
    }))
    .sort((a: any, b: any) => b.days - a.days)
    .slice(0, 8);

  const fasceMap: Record<string, { revenue: number; cost: number }> = {
    "0–20€":   { revenue: 0, cost: 0 },
    "20–50€":  { revenue: 0, cost: 0 },
    "50–100€": { revenue: 0, cost: 0 },
    "100€+":   { revenue: 0, cost: 0 },
  };
  for (const s of closed) {
    const amt = Number(s.amount ?? 0);
    const cst = Number(s.cost   ?? 0);
    const key = amt < 20 ? "0–20€" : amt < 50 ? "20–50€" : amt < 100 ? "50–100€" : "100€+";
    fasceMap[key].revenue += amt;
    fasceMap[key].cost    += cst;
  }
  const marginsByFascia = Object.entries(fasceMap).map(([fascia, v]) => ({
    fascia,
    margine: v.cost > 0 ? Math.round(((v.revenue - v.cost) / v.cost) * 100) : 0,
    ricavi:  +v.revenue.toFixed(2),
  }));

  const kpi = {
    totalRevenue, totalCost, profit, avgMargin, totalPending,
    totalSales:   sales.length,
    closedSales:  closed.length,
    pendingSales: open.length,
    staleItems,
    stockCount:   stock.filter((i: any) => i.status === "available").length,
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Dashboard</h1>
        <p style={{ color: "rgba(255,255,255,.45)", fontSize: 13 }}>
          Aggiornata in tempo reale dall&apos;estensione
        </p>
      </div>
      <DashboardCharts
        kpi={kpi}
        revenueByMonth={revenueByMonth}
        topProducts={topProducts}
        byProfile={byProfile}
        staleStock={staleStock}
        marginsByFascia={marginsByFascia}
      />
    </div>
  );
}
