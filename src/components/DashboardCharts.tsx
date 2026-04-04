"use client";
// src/components/DashboardCharts.tsx
import { useState, useEffect } from "react";
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";
import {
  TrendingUp, TrendingDown, Clock, Layers,
  ShoppingBag, Wallet, Search, SlidersHorizontal,
  ArrowUpRight, ArrowDownRight, MoreHorizontal,
  Package, CreditCard, DollarSign, AlertTriangle
} from "lucide-react";
import ProfilesCard from "@/components/ProfilesCard";
import SalesChartCard from "@/components/SalesChartCard";
import ConversionRateCard from "@/components/ConversionRateCard";
import TopProductsCard from "@/components/TopProductsCard";

/* ── palette ── */
const GREEN    = "#007782";
const GREEN_L  = "#007782";
const GREEN_XL = "#007782";
const GREEN_BG = "#f0fad0";
const RED      = "#FF4D4D";
const AMB      = "#F5A623";
const BLU      = "#3b82f6";
const VIOLET   = "#7c3aed";
const INK      = "#111111";
const SL       = "#888888";
const BD       = "#EBEBEB";
const LT       = "#F5F5F5";
const W        = "#ffffff";

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtShort(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: W, border: `1px solid ${BD}`, borderRadius: 12,
      padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,.10)", fontSize: 12
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: SL, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
          <span style={{ width: 8, height: 8, borderRadius: 3, background: p.color, flexShrink: 0 }} />
          <span style={{ color: SL }}>{p.name}</span>
          <span style={{ fontWeight: 700, color: INK, marginLeft: "auto" }}>€{fmt(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Interfaces ── */
interface SaleRow {
  id?: string;
  buyer_seller?: string;
  amount?: number;
  cost?: number;
  status?: string;
  transaction_date?: string;
  item_name?: string;
  profile_id?: string;
  template_id_ext?: string;
}

interface StockItem {
  id?: string;
  name?: string | null;
  size?: string | null;
  quantity?: number | null;
  purchase_price?: number | null;
  status?: string | null;
  purchased_at?: string | null;
  profile_id?: string | null;
  template_id_ext?: string | null;
  potentialPrice?: number | null;
}

interface Props {
  kpi: {
    totalRevenue: number; totalCost: number; profit: number;
    avgMargin: number; totalPending: number; totalSales: number;
    closedSales: number; pendingSales: number; staleItems: number; stockCount: number; stockCost: number;
    allRevenue: number; allPending: number; allCost: number;
    allClosedSales: number; allPendingSales: number;
    potentialStockValue: number;
    ytdProfit: number; ytdMargin: number; ytdRevenue: number; ytdCost: number; ytdPending: number;
    ytdClosedSales: number; ytdOpenSales: number; ytdStockCount: number; currentYear: number;
  };
  revenueByMonth: { month: string; ricavi: number; costi: number; profitto: number; vendite: number }[];
  topProducts: { name: string; profitto: number; margine: number }[];
  byProfile: { name: string; ricavi: number; vendite: number }[];
  staleStock: { name: string; days: number; cost: number; profile: string }[];
  marginsByFascia: { fascia: string; margine: number; ricavi: number }[];
  recentSales?: SaleRow[];
  allSales?: SaleRow[];
  photoMap?: Record<string, string>;
  profiles?: { id: string; name: string; avatar_url?: string | null }[];
  stockItems?: StockItem[];
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  closed:  { label: "Completata", color: "#6bb800",  bg: GREEN_BG },
  open:    { label: "In sospeso", color: AMB,    bg: "#fef3c7" },
  pending: { label: "In attesa",  color: BLU,    bg: "#dbeafe" },
};

const STOCK_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: "Disponibile", color: "#007782", bg: "rgba(0,119,130,0.08)" },
  reserved:  { label: "Riservato",   color: AMB,       bg: "#fef3c7" },
  sold:      { label: "Venduto",     color: "#6bb800",  bg: GREEN_BG },
};


export default function DashboardCharts({
  kpi, revenueByMonth, topProducts, byProfile, staleStock, marginsByFascia,
  recentSales = [], allSales = [], photoMap = {}, profiles = [], stockItems = []
}: Props) {
  const [searchTerm, setSearchTerm]           = useState("");
  const [statusFilter, setStatusFilter]       = useState<string | null>(null);
  const [activeView, setActiveView]           = useState<"vendite" | "magazzino">("vendite");
  const [stockSearch, setStockSearch]         = useState("");
  const [spotlightKey, setSpotlightKey]       = useState<"profit"|"revenue"|"cost"|"pending">("profit");
  const [stockSpotKey, setStockSpotKey]       = useState<"roi"|"costo"|"prezzo"|"bloccato">("roi");

  // Track window width to show/hide chart column content inline
  // Start with false to avoid hydration mismatch (server doesn't know window width)
  const [showChartInline, setShowChartInline] = useState<boolean>(false);
  useEffect(() => {
    const check = () => setShowChartInline(window.innerWidth <= 1060);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const {
    totalRevenue, totalCost, profit, avgMargin, totalPending,
    closedSales, pendingSales, staleItems, stockCount, totalSales, stockCost,
    allClosedSales, allPendingSales,
    allRevenue, allPending, allCost, potentialStockValue,
    ytdProfit, ytdMargin, ytdRevenue, ytdCost, ytdPending,
    ytdClosedSales, ytdOpenSales, ytdStockCount, currentYear,
  } = kpi;

  const nowTs = Date.now();

  const filteredSales = recentSales.filter(s => {
    if (statusFilter && s.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.buyer_seller || "").toLowerCase().includes(term) ||
      (s.item_name || "").toLowerCase().includes(term)
    );
  });

  const filteredStock = stockItems.filter(i => {
    if (!stockSearch) return true;
    return (i.name || "").toLowerCase().includes(stockSearch.toLowerCase());
  });

  // Spotlight — calcolato sui recentSales (già filtrati per profilo)
  const spotRevenue  = recentSales.filter(s => s.status === "closed").reduce((a, s) => a + Number(s.amount ?? 0), 0);
  const spotPending  = recentSales.filter(s => s.status === "open").reduce((a, s) => a + Number(s.amount ?? 0), 0);
  const spotCost     = recentSales.reduce((a, s) => a + Number(s.cost ?? 0), 0);
  const spotProfit   = spotRevenue - spotCost;
  const spotMargin   = spotCost > 0 ? Math.round(((spotRevenue - spotCost) / spotCost) * 100) : 0;

  const spotlightData = {
    profit:  { label: "Profitto netto",   value: spotProfit,            sub: `${spotMargin >= 0 ? "+" : ""}${spotMargin}% margine`,  color: spotProfit >= 0 ? "#6bb800" : RED,  subColor: spotProfit >= 0 ? "#6bb800" : RED },
    revenue: { label: "Ricavi totali",    value: spotRevenue + spotPending, sub: `${recentSales.filter(s=>s.status==="closed").length} chiuse · ${recentSales.filter(s=>s.status==="open").length} aperte`, color: BLU, subColor: BLU },
    cost:    { label: "Costi acquisti",   value: spotCost,              sub: `${recentSales.length} vendite totali`,                 color: RED,                             subColor: RED },
    pending: { label: "In sospeso",       value: spotPending,           sub: `${recentSales.filter(s=>s.status==="open").length} vendite aperte`,   color: AMB,                             subColor: AMB },
  };
  const spot = spotlightData[spotlightKey];

  const plData = revenueByMonth.slice(-8).map(m => ({
    month: m.month,
    profitto: m.profitto,
    costi: m.costi,
  }));

  return (
    <>
      <style>{`

        .fx-card {
          background: ${W};
          border: none;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          border-radius: 20px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          min-width: 0;
        }
        .fx-card-green {
          background: #111111;
          border: none;
          color: #fff;
        }
        .fx-card-dark {
          background: ${W};
          border: none;
          border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          padding: 20px 24px;
          position: relative;
          overflow: hidden;
        }
        .fx-card-label {
          font-size: 11px; font-weight: 600; color: ${SL};
          margin-bottom: 4px; text-transform: uppercase; letter-spacing: .05em;
          display: flex; align-items: center; justify-content: space-between;
        }
        .fx-card-green .fx-card-label { color: rgba(255,255,255,.55); }
        .fx-card-value {
          font-size: 32px; font-weight: 800;
          letter-spacing: -.04em; line-height: 1.1;
          margin-bottom: 6px; font-variant-numeric: tabular-nums;
        }
        .fx-delta {
          display: inline-flex; align-items: center; gap: 3px;
          font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px;
        }
        .fx-delta-up   { color: #6bb800; background: ${GREEN_BG}; }
        .fx-delta-down { color: ${RED};   background: rgba(255,77,77,.08); }
        .fx-card-green .fx-delta { color: ${GREEN}; background: rgba(0,119,130,.15); }
        .fx-subtitle { font-size: 11px; color: ${SL}; margin-top: 2px; }
        .fx-card-green .fx-subtitle { color: rgba(255,255,255,.55); }
        .fx-icon-circle {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .fx-wallets {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 10px; margin-top: 20px; padding-top: 16px;
          border-top: 1px solid ${BD};
        }
        .fx-wallet-item {
          padding: 10px; border-radius: 12px;
          border: 1px solid ${BD}; font-size: 11px;
          background: ${W};
        }
        .fx-table { width: 100%; border-collapse: collapse; }
        .fx-table th {
          text-align: left; padding: 10px 12px; font-size: 11px;
          font-weight: 600; color: ${SL}; border-bottom: 1px solid ${BD};
          text-transform: uppercase; letter-spacing: .05em;
        }
        .fx-table td {
          padding: 14px 12px; font-size: 13px;
          border-bottom: 1px solid ${BD}; color: ${INK};
        }
        .fx-table tr:last-child td { border-bottom: none; }
        .fx-table tr:hover td { background: ${LT}; }
        .fx-table-dark th {
          color: ${SL}; border-bottom: 1px solid ${BD};
        }
        .fx-table-dark td {
          color: ${INK}; border-bottom: 1px solid ${BD};
        }
        .fx-table-dark tr:hover td { background: ${LT}; }
        .fx-status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          display: inline-block; margin-right: 6px;
        }
        .fx-search-wrap {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; border: 1px solid ${BD};
          border-radius: 12px; background: ${W}; min-width: 0; max-width: 220px; flex: 1;
        }
        .fx-search-wrap input {
          border: none; outline: none; font-size: 13px;
          font-family: inherit; color: ${INK}; background: transparent; width: 100%;
        }
        .fx-search-wrap input::placeholder { color: #b0b0b0; }
        .fx-search-dark {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; border: 1px solid ${BD};
          border-radius: 12px; background: ${W}; min-width: 0; max-width: 220px; flex: 1;
        }
        .fx-search-dark input {
          border: none; outline: none; font-size: 13px;
          font-family: inherit; color: ${INK}; background: transparent; width: 100%;
        }
        .fx-search-dark input::placeholder { color: #b0b0b0; }
        .fx-filter-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border: 1px solid ${BD}; border-radius: 999px;
          background: ${W}; font-size: 13px; font-weight: 500;
          color: ${SL}; cursor: pointer; font-family: inherit;
        }
        .fx-4cards {
          display: grid; grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 12px;
        }
        .fx-recent-scroll {
          overflow-x: auto;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,.08) transparent;
        }
        .fx-recent-scroll::-webkit-scrollbar { width: 4px; }
        .fx-recent-scroll::-webkit-scrollbar-track { background: transparent; }
        .fx-recent-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,.08); border-radius: 4px; }
        .fx-dark-scroll {
          overflow-x: auto;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,.08) transparent;
        }
        .fx-dark-scroll::-webkit-scrollbar { width: 4px; }
        .fx-dark-scroll::-webkit-scrollbar-track { background: transparent; }
        .fx-dark-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,.08); border-radius: 4px; }
        .fx-tab-btn {
          flex: 1; padding: 10px 0; border-radius: 999px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          border: none; font-family: inherit; transition: all .18s;
        }
        .fx-tab-active-vendite {
          background: #111111; color: #fff;
        }
        .fx-tab-active-magazzino {
          background: #111111; color: #fff;
        }
        .fx-tab-active {
          background: #111111; color: #fff;
        }
        .fx-tab-inactive {
          background: ${LT}; color: ${SL}; border: none !important;
        }
        .fx-tab-inactive:hover { background: #ebebeb; color: ${INK}; }
        .fx-stock-filter-pill {
          padding: 4px 14px; border-radius: 999px; font-size: 11px; font-weight: 600;
          cursor: pointer; border: 1px solid transparent; transition: all .15s;
          font-family: inherit;
        }
        .fx-dark-bar {
          height: 3px; border-radius: 2px; margin-top: 12px;
        }
        @media (max-width: 600px) {
          .fx-4cards { grid-template-columns: 1fr 1fr; }
          .fx-search-wrap { width: 100%; }
          .fx-card-value { font-size: 24px; }
        }
        @media (max-width: 420px) {
          .fx-card { padding: 16px; border-radius: 16px; }
          .fx-card-value { font-size: 20px; }
        }
      `}</style>

      <div className="fx-grid">

        {/* ═══ LEFT COLUMN ═══ */}
        <div className="fx-left">

          {/* Profitto Totale */}
          <div className="fx-card">
            <div className="fx-card-label">
              <span>{activeView === "magazzino" ? "Articoli in stock" : "Profitto Totale"}</span>
              <span style={{ fontSize: 11, color: SL, display: "flex", alignItems: "center", gap: 4 }}>
                {activeView === "magazzino" ? <Package size={13} color={BLU} /> : <><span style={{ fontSize: 12 }}>🇮🇹</span> {currentYear}</>}
              </span>
            </div>
            {activeView === "magazzino" ? (
              <>
                <div className="fx-card-value" style={{ color: BLU }}>{stockCount}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span className="fx-delta" style={{ color: BLU, background: "#dbeafe" }}>
                    <ArrowUpRight size={12} /> {ytdStockCount} quest&apos;anno
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="fx-card-value" style={{ color: ytdProfit >= 0 ? "#6bb800" : RED }}>€{fmt(ytdProfit)}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span className={`fx-delta ${ytdMargin >= 0 ? "fx-delta-up" : "fx-delta-down"}`}>
                    {ytdMargin >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {ytdMargin}%
                  </span>
                  <span className="fx-subtitle">margine sul costo</span>
                </div>
              </>
            )}

            {/* Toggle Vendite / Magazzino */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className={`fx-tab-btn ${activeView === "vendite" ? "fx-tab-active-vendite" : "fx-tab-inactive"}`}
                onClick={() => setActiveView("vendite")}
              >
                <ShoppingBag size={14} /> Vendite
              </button>
              <button
                className={`fx-tab-btn ${activeView === "magazzino" ? "fx-tab-active-magazzino" : "fx-tab-inactive"}`}
                onClick={() => setActiveView("magazzino")}
              >
                <Package size={14} /> Magazzino
              </button>
            </div>

            <div className="fx-wallets">
              {activeView === "vendite" ? (<>
                <div className="fx-wallet-item">
                  <div style={{ fontWeight: 700, fontSize: 13, color: INK }}>{ytdClosedSales}</div>
                  <div style={{ color: SL, marginTop: 2, fontSize: 10 }}>Concluse</div>
                  <div style={{ fontSize: 10, color: "#6bb800", fontWeight: 600, marginTop: 4 }}>Attive</div>
                </div>
                <div className="fx-wallet-item">
                  <div style={{ fontWeight: 700, fontSize: 13, color: INK }}>{ytdOpenSales}</div>
                  <div style={{ color: SL, marginTop: 2, fontSize: 10 }}>In sospeso</div>
                  <div style={{ fontSize: 10, color: AMB, fontWeight: 600, marginTop: 4 }}>Aperte</div>
                </div>
                <div className="fx-wallet-item">
                  <div style={{ fontWeight: 700, fontSize: 13, color: INK }}>€{fmt(ytdRevenue + ytdPending)}</div>
                  <div style={{ color: SL, marginTop: 2, fontSize: 10 }}>Ricavi totali</div>
                  <div style={{ fontSize: 10, color: BLU, fontWeight: 600, marginTop: 4 }}>YTD</div>
                </div>
              </>) : (<>
                <div className="fx-wallet-item">
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#6bb800" }}>€{fmt(potentialStockValue)}</div>
                  <div style={{ color: SL, marginTop: 2, fontSize: 10 }}>Valore Potenziale</div>
                  <div style={{ fontSize: 10, color: "#6bb800", fontWeight: 600, marginTop: 4 }}>Stock</div>
                </div>
                <div className="fx-wallet-item">
                  <div style={{ fontWeight: 700, fontSize: 13, color: INK }}>€{fmt(stockCost)}</div>
                  <div style={{ color: SL, marginTop: 2, fontSize: 10 }}>Costo totale</div>
                  <div style={{ fontSize: 10, color: RED, fontWeight: 600, marginTop: 4 }}>Uscite</div>
                </div>
                <div className="fx-wallet-item">
                  <div style={{ fontWeight: 700, fontSize: 13, color: staleItems > 0 ? AMB : INK }}>{staleItems}</div>
                  <div style={{ color: SL, marginTop: 2, fontSize: 10 }}>Fermi &gt;60gg</div>
                  <div style={{ fontSize: 10, color: staleItems > 0 ? AMB : SL, fontWeight: 600, marginTop: 4 }}>Da smaltire</div>
                </div>
              </>)}
            </div>
          </div>

          {/* Profili */}
          <div className="fx-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: INK }}>Profili</span>
              <span style={{ fontSize: 11, color: SL }}>account Vinted</span>
            </div>
            <ProfilesCard profiles={profiles} />
          </div>

          {/* Cash Flow */}
          {(() => {
            const cfEntrate = allRevenue + allPending;
            const cfUscite  = allCost + stockCost;
            const cfSaldo   = cfEntrate - cfUscite;
            const cfNeg     = cfSaldo < 0;
            const cfRate    = cfUscite > 0 ? ((cfEntrate / cfUscite) * 100).toFixed(1) : "—";
            return (
              <div className="fx-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: SL, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 14 }}>
                  Cash flow — all time
                </div>
                <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1, color: cfNeg ? RED : "#6bb800", marginBottom: 6 }}>
                  {cfNeg ? "−" : "+"}€{Math.abs(Math.round(cfSaldo))}
                </div>
                <div style={{ fontSize: 12, color: SL, marginBottom: 4 }}>saldo netto</div>
                <div style={{ fontSize: 12, color: SL, marginBottom: 16 }}>{cfRate}% recovery rate</div>
                <div style={{ height: "0.5px", background: BD, marginBottom: 14 }} />
                <div style={{ display: "flex", justifyContent: "center", gap: 20, alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, color: SL }}>entrate</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M5 8V2M2 5l3-3 3 3" stroke="#1D9E75" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#6bb800" }}>€{fmt(cfEntrate)}</span>
                    </div>
                  </div>
                  <div style={{ width: "0.5px", height: 32, background: BD }} />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, color: SL }}>uscite</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#FCEBEB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M5 2v6M2 5l3 3 3-3" stroke="#E24B4A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: RED }}>€{fmt(cfUscite)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="fx-right">

          {/* ── VISTA VENDITE ── */}
          {activeView === "vendite" && (
            <>
              {/* Spotlight */}
              <div className="fx-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: SL, marginBottom: 6 }}>{spot.label}</div>
                <div style={{ fontSize: 40, fontWeight: 800, color: spot.color, letterSpacing: "-.04em", lineHeight: 1.1 }}>
                  €{fmt(spot.value)}
                </div>
                <div style={{ fontSize: 12, color: spot.subColor, marginTop: 4, marginBottom: 16 }}>{spot.sub}</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                  {([
                    { key: "profit",  label: "Profitto",  bg: GREEN_BG, color: "#6bb800" },
                    { key: "revenue", label: "Ricavi",    bg: "#dbeafe", color: BLU },
                    { key: "cost",    label: "Costi",     bg: `${RED}08`, color: RED },
                    { key: "pending", label: "Sospeso",   bg: "#fef3c7", color: AMB },
                  ] as const).map(({ key, label, bg, color }) => (
                    <button
                      key={key}
                      onClick={() => setSpotlightKey(key)}
                      style={{
                        fontSize: 12, fontWeight: spotlightKey === key ? 700 : 500,
                        background: spotlightKey === key ? bg : LT,
                        color: spotlightKey === key ? color : SL,
                        padding: "6px 16px", borderRadius: 999,
                        border: spotlightKey === key ? `1.5px solid ${color}` : `1px solid ${BD}`,
                        cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabella Attività Recenti */}
              <div className="fx-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>Attività Recenti</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="fx-search-wrap">
                      <Search size={15} color="#b0b0b0" />
                      <input type="text" placeholder="Cerca..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="fx-recent-scroll" style={{ maxHeight: 480 }}>
                  <table className="fx-table">
                    <thead>
                      <tr>
                        <th className="fx-col-hide-md">Data</th>
                        <th>Articolo</th>
                        <th className="fx-col-hide-md" style={{ textAlign: "right" }}>Acquisto</th>
                        <th style={{ textAlign: "right" }}>Vendita</th>
                        <th style={{ textAlign: "right" }}>Margine</th>
                        <th>Stato</th>
                        <th className="fx-col-hide-sm">Profilo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: "center", color: SL, padding: "32px 12px" }}>
                            {recentSales.length === 0 ? "Nessuna vendita recente" : "Nessun risultato"}
                          </td>
                        </tr>
                      ) : (
                        filteredSales.map((sale, i) => {
                          const sMeta = STATUS_META[sale.status || "open"] || STATUS_META.open;
                          const dateStr = sale.transaction_date
                            ? new Date(sale.transaction_date).toLocaleDateString("it", { day: "2-digit", month: "2-digit", year: "numeric" })
                            : "—";
                          const amount = Number(sale.amount ?? 0);
                          const cost   = Number(sale.cost ?? 0);
                          const marginAbs = amount - cost;
                          const marginPct = cost > 0 ? Math.round(((amount - cost) / cost) * 100) : 0;
                          const photoUrl = sale.template_id_ext ? photoMap[sale.template_id_ext] : null;

                          return (
                            <tr key={sale.id || i}>
                              <td className="fx-col-hide-md" style={{ fontSize: 12, color: SL, whiteSpace: "nowrap" }}>{dateStr}</td>
                              <td style={{ maxWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  {photoUrl ? (
                                    <img src={photoUrl} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "none" }} />
                                  ) : (
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: LT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "none" }}>
                                      <ShoppingBag size={14} color={SL} />
                                    </div>
                                  )}
                                  <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {(sale.buyer_seller || sale.item_name || "Vendita").slice(0, 40)}
                                  </span>
                                </div>
                              </td>
                              <td className="fx-col-hide-md" style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 13, color: SL, fontVariantNumeric: "tabular-nums" }}>
                                  {cost > 0 ? `€${fmt(cost)}` : "—"}
                                </div>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <div style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: INK }}>€{fmt(amount)}</div>
                                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2, color: marginAbs >= 0 ? "#6bb800" : RED, fontVariantNumeric: "tabular-nums" }}>
                                  {marginAbs >= 0 ? "+" : ""}€{fmt(marginAbs)}
                                </div>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: marginPct >= 0 ? "#6bb800" : RED }}>
                                  {marginPct >= 0 ? "▲" : "▼"} {Math.abs(marginPct)}%
                                </span>
                              </td>
                              <td>
                                <span
                                  onClick={() => setStatusFilter(statusFilter === (sale.status || "open") ? null : (sale.status || "open"))}
                                  style={{
                                    display: "inline-flex", alignItems: "center", gap: 5,
                                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                                    color: sMeta.color,
                                    transition: "opacity .15s",
                                    opacity: statusFilter && statusFilter !== (sale.status || "open") ? .4 : 1,
                                  }}
                                >
                                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: sMeta.color, display: "inline-block", flexShrink: 0 }} />
                                  {sMeta.label}
                                </span>
                              </td>
                              <td className="fx-col-hide-sm" style={{ fontSize: 12, color: SL }}>
                                {profiles.find((p: any) => p.id === sale.profile_id)?.name ?? "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── VISTA MAGAZZINO ── */}
          {activeView === "magazzino" && (
            <>
              {/* Tabella Stock Magazzino */}
              <div className="fx-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>Stock Magazzino</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="fx-search-wrap">
                      <Search size={15} color="#b0b0b0" />
                      <input type="text" placeholder="Cerca articolo..." value={stockSearch} onChange={e => setStockSearch(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="fx-recent-scroll" style={{ maxHeight: 480 }}>
                  <table className="fx-table">
                    <thead>
                      <tr>
                        <th>Articolo</th>
                        <th className="fx-col-hide-md">Taglia</th>
                        <th className="fx-col-hide-md" style={{ textAlign: "right" }}>Costo</th>
                        <th style={{ textAlign: "right" }}>Prezzo</th>
                        <th style={{ textAlign: "right" }}>Giorni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStock.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", color: SL, padding: "32px 12px" }}>
                            Nessun articolo trovato
                          </td>
                        </tr>
                      ) : (
                        filteredStock.map((item, i) => {
                          const photoUrl = item.template_id_ext ? photoMap[item.template_id_ext] : null;
                          const cost = Number(item.purchase_price ?? 0);
                          const price = Number(item.potentialPrice ?? 0);
                          const marginAbs = price - cost;
                          const days = item.purchased_at
                            ? Math.floor((nowTs - new Date(item.purchased_at).getTime()) / 86400000)
                            : null;
                          const isStale = days !== null && days > 60;

                          return (
                            <tr key={item.id || i}>
                              <td style={{ maxWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  {photoUrl ? (
                                    <img src={photoUrl} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "none" }} />
                                  ) : (
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: LT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "none" }}>
                                      <Package size={14} color={SL} />
                                    </div>
                                  )}
                                  <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {(item.name || "Articolo").slice(0, 40)}
                                  </span>
                                </div>
                              </td>
                              <td className="fx-col-hide-md" style={{ fontSize: 12, color: SL }}>
                                {item.size || "—"}
                              </td>
                              <td className="fx-col-hide-md" style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 13, color: SL, fontVariantNumeric: "tabular-nums" }}>
                                  {cost > 0 ? `€${fmt(cost)}` : "—"}
                                </div>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <div style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: INK }}>
                                  {price > 0 ? `€${fmt(price)}` : "—"}
                                </div>
                                {price > 0 && cost > 0 && (
                                  <div style={{ fontSize: 11, fontWeight: 600, color: marginAbs >= 0 ? "#6bb800" : RED, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
                                    {marginAbs >= 0 ? "+" : ""}€{fmt(marginAbs)}
                                  </div>
                                )}
                              </td>
                              <td style={{ textAlign: "right" }}>
                                {days !== null ? (
                                  <span style={{
                                    fontSize: 12, fontWeight: 600,
                                    color: isStale ? AMB : SL,
                                    display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3
                                  }}>
                                    {isStale && <AlertTriangle size={11} />}
                                    {days}gg
                                  </span>
                                ) : <span style={{ color: SL }}>—</span>}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card Clearance */}
              {(() => {
                const staleList = stockItems
                  .filter(i => i.status === "available" && i.purchased_at && Math.floor((nowTs - new Date(i.purchased_at).getTime()) / 86400000) > 60)
                  .sort((a, b) => new Date(a.purchased_at!).getTime() - new Date(b.purchased_at!).getTime());

                return (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
                    <div className="fx-card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>Clearance</div>
                        {staleList.length > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: AMB, background: "transparent", padding: "2px 0" }}>
                            {staleList.length}
                          </span>
                        )}
                      </div>
                      {staleList.length === 0 ? (
                        <div style={{ padding: "24px 0", fontSize: 13, color: SL, textAlign: "center" }}>Nessun articolo fermo da più di 60 giorni</div>
                      ) : (
                        <div className="fx-recent-scroll" style={{ maxHeight: 280 }}>
                          <table className="fx-table">
                            <thead>
                              <tr>
                                <th></th>
                                <th>Articolo</th>
                                <th style={{ textAlign: "right" }}>Acquistato</th>
                                <th style={{ textAlign: "right" }}>Giorni</th>
                              </tr>
                            </thead>
                            <tbody>
                              {staleList.map((item, i) => {
                                const days = Math.floor((nowTs - new Date(item.purchased_at!).getTime()) / 86400000);
                                const dateStr = new Date(item.purchased_at!).toLocaleDateString("it", { day: "2-digit", month: "2-digit", year: "numeric" });
                                const photoUrl = item.template_id_ext ? photoMap[item.template_id_ext] : null;
                                return (
                                  <tr key={item.id || i}>
                                    <td style={{ width: 44, paddingRight: 0 }}>
                                      {photoUrl ? (
                                        <img src={photoUrl} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover", border: "none", display: "block" }} />
                                      ) : (
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: LT, display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
                                          <Package size={14} color={SL} />
                                        </div>
                                      )}
                                    </td>
                                    <td>
                                      <div style={{ fontWeight: 500, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                                        {(item.name || "Articolo").slice(0, 35)}
                                      </div>
                                    </td>
                                    <td style={{ textAlign: "right", fontSize: 12, color: SL, whiteSpace: "nowrap" }}>{dateStr}</td>
                                    <td style={{ textAlign: "right" }}>
                                      <span style={{ fontSize: 12, fontWeight: 600, color: AMB, background: "transparent", padding: "0", whiteSpace: "nowrap" }}>
                                        {days}gg
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Prossimamente */}
                    <div className="fx-card" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ textAlign: "center", color: SL }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: LT, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                          <Clock size={18} color={SL} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: INK }}>Prossimamente</div>
                        <div style={{ fontSize: 11, color: SL, marginTop: 4 }}>Nuove funzionalità in arrivo</div>
                      </div>
                    </div>
                    </div>

                  </>
                );
              })()}
            </>
          )}

          {/* Chart cards shown inline when window is too narrow for 3 columns */}
          {showChartInline && activeView === "vendite" && (
            <>
              <SalesChartCard sales={recentSales} />
              <ConversionRateCard sold={allClosedSales} pending={allPendingSales} available={stockCount} staleItems={staleItems} />
              <TopProductsCard sales={allSales} photoMap={photoMap} stockItems={stockItems} />
            </>
          )}

        </div>{/* end fx-right */}

        {/* ═══ RIGHT CHART COLUMN ═══ */}
        <div className="fx-chart">
          {activeView === "vendite" ? (
            <>
              <SalesChartCard sales={recentSales} />
              <ConversionRateCard sold={allClosedSales} pending={allPendingSales} available={stockCount} staleItems={staleItems} />
              <TopProductsCard sales={allSales} photoMap={photoMap} stockItems={stockItems} />
            </>
          ) : (
            <>
              {[1,2].map(i => (
                <div key={i} className="fx-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111111" }}>Prossimamente</div>
                  <div style={{ fontSize: 11, color: "#888888" }}>Nuove funzionalità in arrivo</div>
                </div>
              ))}
            </>
          )}
        </div>

      </div>{/* end fx-grid */}
    </>
  );
}
