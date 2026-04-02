// src/app/(dashboard)/page.tsx
import { createClient } from "@/lib/supabase/server";
import DashboardCharts from "@/components/DashboardCharts";

export const revalidate = 0;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 13) return "Buongiorno";
  if (h < 18) return "Buon pomeriggio";
  return "Buonasera";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string }>;
}) {
  const { profile: selectedProfileId } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: salesData }, { data: stockData }, { data: profilesData }, { data: templatesData }] = await Promise.all([
    supabase.from("sales_log").select("*").order("transaction_date", { ascending: false }),
    supabase.from("stock_log").select("*").order("purchased_at", { ascending: false }),
    if (!user) return; // oppure redirect, o return null nel componente

supabase.from("profiles").select("id,name,avatar_url").eq("user_id", user.id),
    supabase.from("templates").select("id,name,photo_urls,price"),
  ]);

  const allSales   = (salesData     ?? []) as any[];
  const stock      = (stockData     ?? []) as any[];
  const profiles   = (profilesData  ?? []) as { id: string; name: string; avatar_url?: string | null }[];
  const templates  = (templatesData ?? []) as { id: string; name: string; photo_urls: string[] | null; price?: number | null }[];
  const nowTs      = Date.now();

  // Filtra vendite per profilo selezionato
  const sales = selectedProfileId
    ? allSales.filter((s: any) => s.profile_id === selectedProfileId)
    : allSales;

  const profileNamesMap: Record<string, string> = {};
  for (const p of profiles) profileNamesMap[p.id] = p.name;

  // Mappa template_id → prima foto e prezzo
  const photoMap: Record<string, string> = {};
  const templatePriceMap: Record<string, number> = {};
  for (const tpl of templates) {
    if (Array.isArray(tpl.photo_urls) && tpl.photo_urls[0]) {
      photoMap[tpl.id] = tpl.photo_urls[0];
    }
    if (tpl.price != null) templatePriceMap[tpl.id] = Number(tpl.price);
  }

  // Valore potenziale = somma prezzi template degli articoli available
  const potentialStockValue = stock
    .filter((i: any) => i.status === "available" && i.template_id_ext)
    .reduce((s: number, i: any) => {
      const price = templatePriceMap[i.template_id_ext] ?? 0;
      return s + price * Number(i.quantity ?? 1);
    }, 0);

  const closed = sales.filter((s: any) => s.status === "closed");
  const open   = sales.filter((s: any) => s.status === "open");

  // ── Dati anno corrente per la card "Profitto Totale" ──
  // Usa SEMPRE allSales (non filtrati per profilo) — la card è globale
  const currentYear = new Date().getFullYear();
  const isCurrentYear = (s: any) => {
    const d = s.transaction_date ? new Date(s.transaction_date).getFullYear() : null;
    return d === currentYear;
  };
  const salesYTD   = allSales.filter(isCurrentYear);
  const closedYTD  = salesYTD.filter((s: any) => s.status === "closed");
  const openYTD    = salesYTD.filter((s: any) => s.status === "open");

  const ytdRevenue   = closedYTD.reduce((s: number, x: any) => s + Number(x.amount ?? 0), 0);
  const ytdCost      = salesYTD.reduce((s: number, x: any) => s + Number(x.cost ?? 0), 0);
  const ytdPending   = openYTD.reduce((s: number, x: any) => s + Number(x.amount ?? 0), 0);
  const ytdProfit    = ytdRevenue + ytdPending - ytdCost;
  const ytdMargin    = ytdCost > 0 ? Math.round(((ytdRevenue + ytdPending - ytdCost) / ytdCost) * 100) : 0;

  // ── Dati globali (tutti i periodi) ──
  const totalRevenue = closed.reduce((s: number, x: any) => s + Number(x.amount ?? 0), 0);
  const totalCost    = sales.reduce((s: number, x: any) => s + Number(x.cost ?? 0), 0);
  const totalPending = open.reduce((s: number, x: any) => s + Number(x.amount ?? 0), 0);
  // stockCost = solo articoli ancora in magazzino (available/reserved), non i venduti già contati in sales_log.cost
  const stockCost    = stock.filter((i: any) => i.status === "available" || i.status === "reserved").reduce((s: number, x: any) => s + Number(x.purchase_price ?? 0), 0);
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

  const profileRevenueMap: Record<string, { revenue: number; count: number }> = {};
  for (const s of closed) {
    const pid  = String(s.profile_id || "Nessuno");
    const name = profileNamesMap[pid] ?? pid;
    if (!profileRevenueMap[name]) profileRevenueMap[name] = { revenue: 0, count: 0 };
    profileRevenueMap[name].revenue += Number(s.amount ?? 0);
    profileRevenueMap[name].count   += 1;
  }

  const byProfile = Object.entries(profileRevenueMap)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .map(([name, v]) => ({
      name,
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

  // Cash flow all time — sempre su tutti i dati, non filtrati per profilo
  const allClosed  = allSales.filter((s: any) => s.status === "closed");
  const allOpen    = allSales.filter((s: any) => s.status === "open");
  const allRevenue = allClosed.reduce((s: number, x: any) => s + Number(x.amount ?? 0), 0);
  const allPending = allOpen.reduce((s: number, x: any) => s + Number(x.amount ?? 0), 0);
  const allCost    = allSales.reduce((s: number, x: any) => s + Number(x.cost ?? 0), 0);

  const kpi = {
    totalRevenue, totalCost, profit, avgMargin, totalPending, stockCost,
    allRevenue, allPending, allCost,
    totalSales:   sales.length,
    closedSales:  closed.length,
    pendingSales: open.length,
    staleItems,
    allClosedSales:  allSales.filter((s: any) => s.status === "closed").length,
    allPendingSales: allSales.filter((s: any) => s.status === "open").length,
    stockCount:   stock.filter((i: any) => i.status === "available").length,
    potentialStockValue,
    // Anno corrente
    ytdProfit, ytdMargin, ytdRevenue, ytdCost, ytdPending,
    ytdClosedSales: closedYTD.length,
    ytdOpenSales:   openYTD.length,
    ytdStockCount:  stock.filter((i: any) => {
      if (i.status !== "available") return false;
      const d = i.purchased_at ? new Date(i.purchased_at).getFullYear() : null;
      return d === currentYear;
    }).length,
    currentYear,
  };

  // --- Greeting ---
  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0]
    ?? user?.user_metadata?.name?.split(" ")[0]
    ?? user?.user_metadata?.display_name
    ?? user?.email?.split("@")[0]
    ?? "utente";
  const greeting = getGreeting();

  // Recent sales for the activities table — usa tutte le vendite filtrate per profilo
  const recentSales = sales.map((s: any) => ({
    id: s.id,
    buyer_seller: s.buyer_seller,
    item_name: s.item_name,
    amount: s.amount,
    cost: s.cost,
    status: s.status,
    transaction_date: s.transaction_date,
    profile_id: s.profile_id,
    template_id_ext: s.template_id_ext,
  }));

  const selectedProfileName = selectedProfileId
    ? (profiles.find(p => p.id === selectedProfileId)?.name ?? null)
    : null;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, color: "#111111", letterSpacing: "-.03em" }}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{ color: "#888888", fontSize: 14 }}>
          {selectedProfileName
            ? <>Stai visualizzando i dati del profilo <strong style={{ color: "#111111" }}>{selectedProfileName}</strong> — <a href="/" style={{ color: "#888888", textDecoration: "underline", cursor: "pointer" }}>mostra tutti</a></>
            : "Tieni sotto controllo le tue vendite e monitora i progressi"
          }
        </p>
      </div>
      <DashboardCharts
        kpi={kpi}
        revenueByMonth={revenueByMonth}
        topProducts={topProducts}
        byProfile={byProfile}
        staleStock={staleStock}
        marginsByFascia={marginsByFascia}
        recentSales={recentSales}
        allSales={allSales.map((s: any) => ({
          id: s.id,
          item_name: s.item_name,
          amount: s.amount,
          cost: s.cost,
          status: s.status,
          transaction_date: s.transaction_date,
          profile_id: s.profile_id,
          template_id_ext: s.template_id_ext,
        }))}
        photoMap={photoMap}
        profiles={profiles}
        stockItems={stock.map((i: any) => ({
          id: i.id,
          name: i.name,
          size: i.size,
          quantity: i.quantity,
          purchase_price: i.purchase_price,
          status: i.status,
          purchased_at: i.purchased_at,
          profile_id: i.profile_id,
          template_id_ext: i.template_id_ext,
          potentialPrice: i.template_id_ext ? (templatePriceMap[i.template_id_ext] ?? null) : null,
        }))}
      />
    </div>
  );
}
