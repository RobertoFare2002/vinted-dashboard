"use client";
// src/components/DashboardCharts.tsx
import { useState, useEffect, useTransition, useMemo, useCallback, useRef } from "react";
import { changeSaleStatus, deleteSale } from "@/app/(dashboard)/sales/actions";
import { deleteStockItem } from "@/app/(dashboard)/stock/actions";
import SaleModal from "@/components/SaleModal";
import StockEditModal from "@/components/StockEditModal";
import SellModal from "@/components/SellModal";
import BundleModal from "@/components/BundleModal";
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
import SalesChartCard, { PeriodState } from "@/components/SalesChartCard";
import ConversionRateCard from "@/components/ConversionRateCard";
import TopProductsCard from "@/components/TopProductsCard";
import AvgTicketCard from "@/components/AvgTicketCard";

/* ── palette ── */
const GREEN    = "#007782";
const GREEN_L  = "#007782";
const GREEN_XL = "#007782";
const GREEN_BG = "#f0fad0";
const RED      = "#FF4D4D";
const AMB      = "#F5A623";
const BLU      = "#3b82f6";
const VIOLET   = "#7c3aed";

/* These are overridden at runtime by useDarkTheme hook */
const INK_LIGHT = "var(--ink)";
const SL_LIGHT  = "var(--slate)";
const BD_LIGHT  = "var(--border)";
const LT_LIGHT  = "var(--light)";
const W_LIGHT   = "var(--white)";

const INK_DARK  = "#f0f0f0";
const SL_DARK   = "rgba(255,255,255,.45)";
const BD_DARK   = "rgba(255,255,255,.10)";
const LT_DARK   = "#27272a";
const W_DARK    = "#1e1e20";

function getDarkVars(dark: boolean) {
  return {
    INK: dark ? INK_DARK : INK_LIGHT,
    SL:  dark ? SL_DARK  : SL_LIGHT,
    BD:  dark ? BD_DARK  : BD_LIGHT,
    LT:  dark ? LT_DARK  : LT_LIGHT,
    W:   dark ? W_DARK   : W_LIGHT,
  };
}



function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtShort(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const tipW = isDark ? "#1e1e20" : "var(--white)";
  const tipBD = isDark ? "rgba(255,255,255,.12)" : "var(--border)";
  const tipINK = isDark ? "#f0f0f0" : "var(--ink)";
  const tipSL = isDark ? "rgba(255,255,255,.45)" : "var(--slate)";
  return (
    <div style={{
      background: tipW, border: `1px solid ${tipBD}`, borderRadius: 12,
      padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,.15)", fontSize: 12
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: tipSL, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
          <span style={{ width: 8, height: 8, borderRadius: 3, background: p.color, flexShrink: 0 }} />
          <span style={{ color: tipSL }}>{p.name}</span>
          <span style={{ fontWeight: 700, color: tipINK, marginLeft: "auto" }}>€{fmt(Number(p.value))}</span>
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
  profiles?: { id: string; name: string; avatar_url?: string | null; salesCount?: number }[];
  stockItems?: StockItem[];
  selectedProfileId?: string | null;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; bgDark: string }> = {
  closed:  { label: "Completato", color: "#6bb800", bg: GREEN_BG,            bgDark: "rgba(107,184,0,.15)" },
  open:    { label: "In sospeso", color: AMB,       bg: "#fef3c7",           bgDark: "rgba(245,166,35,.15)" },
  pending: { label: "In attesa",  color: BLU,       bg: "#dbeafe",           bgDark: "rgba(59,130,246,.15)" },
};

const STOCK_STATUS_META: Record<string, { label: string; color: string; bg: string; bgDark: string }> = {
  available: { label: "Disponibile", color: "#007782", bg: "rgba(0,119,130,0.08)", bgDark: "rgba(0,119,130,0.2)" },
  reserved:  { label: "Riservato",   color: AMB,       bg: "#fef3c7",              bgDark: "rgba(245,166,35,.15)" },
  sold:      { label: "Venduto",     color: "#6bb800",  bg: GREEN_BG,              bgDark: "rgba(107,184,0,.15)" },
};


// Inline Cash Flow card for fx-chart column
function CashFlowInChart({ kpi }: { kpi: Props["kpi"] }) {
  const [dm, setDm] = useState(false);
  useEffect(() => {
    const check = () => setDm(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  const cfcINK = dm ? "#f0f0f0" : "var(--ink)";
  const cfcSL  = dm ? "rgba(255,255,255,.45)" : "var(--slate)";
  const cfcBD  = dm ? "rgba(255,255,255,.10)" : "var(--border)";
  const { allRevenue, allPending, allCost, stockCost } = kpi;
  const cfEntrate = allRevenue + allPending;
  const cfUscite  = allCost + stockCost;
  const cfSaldo   = cfEntrate - cfUscite;
  const cfRate    = cfUscite > 0 ? ((cfEntrate / cfUscite) * 100).toFixed(1) : "—";
  const isNeg     = cfSaldo < 0;
  const fmt = (n: number) => n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className="fx-card cfc-root">
      <style>{`
        .cfc-root { container-type: inline-size; container-name: cfc; }
        .cfc-saldo { font-weight: 700; line-height: 1; margin-bottom: 4px; font-size: 40px; }
        @container cfc (max-width: 240px) { .cfc-saldo { font-size: 28px; } }
        @container cfc (max-width: 200px) { .cfc-saldo { font-size: 22px; } }
      `}</style>
      <div style={{ fontSize: 11, color: cfcSL, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>
        Cash flow — all time
      </div>

      <div style={{ height: "0.5px", background: cfcBD, marginBottom: 12 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        {/* Sinistra: saldo + rate */}
        <div style={{ minWidth: 0 }}>
          <div className="cfc-saldo" style={{ color: isNeg ? RED : "#6bb800" }}>
            {isNeg ? "−" : "+"}€{Math.abs(Math.round(cfSaldo))}
          </div>
          <div style={{ fontSize: 12, color: cfcSL, marginBottom: 2 }}>saldo netto</div>
          <div style={{ fontSize: 12, color: cfcSL }}>{cfRate}% recovery rate</div>
        </div>
        {/* Destra: entrate + uscite */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 10, color: cfcSL, marginBottom: 3, textAlign: "right" }}>entrate</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 8V2M2 5l3-3 3 3" stroke="#1D9E75" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#6bb800" }}>€{fmt(cfEntrate)}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: cfcSL, marginBottom: 3, textAlign: "right" }}>uscite</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#FCEBEB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 2v6M2 5l3 3 3-3" stroke="#E24B4A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: RED }}>€{fmt(cfUscite)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardCharts({
  kpi, revenueByMonth, topProducts, byProfile, staleStock, marginsByFascia,
  recentSales = [], allSales = [], photoMap = {}, profiles = [], stockItems = [], selectedProfileId = null
}: Props) {
  const [searchTerm, setSearchTerm]           = useState("");
  const [statusFilter, setStatusFilter]       = useState<string | null>(null);
  const [searchOpen, setSearchOpen]           = useState(false);
  const [stockSearchOpen, setStockSearchOpen] = useState(false);
  const [activeView, setActiveView]           = useState<"vendite" | "magazzino">("vendite");
  const [stockSearch, setStockSearch]         = useState("");
  const [spotlightKey, setSpotlightKey]       = useState<"profit"|"revenue"|"cost"|"pending">("profit");
  const [stockSpotKey, setStockSpotKey]       = useState<"roi"|"costo"|"prezzo"|"bloccato">("roi");
  const [viewAnimKey, setViewAnimKey]         = useState(0);
  const [closingId, setClosingId]             = useState<string | null>(null);
  const [showPctMargin, setShowPctMargin]     = useState(false);
  const [searchPillOpen, setSearchPillOpen]   = useState(false);
  const [stockPillOpen, setStockPillOpen]     = useState(false);
  const [isPending, startTransition]          = useTransition();

  // ── Context menu (long press mobile) ──
  const [ctxMenuId,    setCtxMenuId]    = useState<string | null>(null);
  const [ctxMenuType,  setCtxMenuType]  = useState<"sale" | "stock" | null>(null);
  const [ctxPos,       setCtxPos]       = useState<{ top: number; right: number } | null>(null);
  const [modalSale,    setModalSale]    = useState<SaleRow | null>(null);
  const [modalStock,   setModalStock]   = useState<StockItem | null>(null);
  const [modalSell,    setModalSell]    = useState<StockItem | null>(null);
  const [modalBundle,  setModalBundle]  = useState<string | null>(null); // preselected stockId
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const salesListRef  = useRef<HTMLDivElement>(null);
  const stockListRef  = useRef<HTMLDivElement>(null);

  // Legge il tema dark mode dalla classe html.dark
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const check = () => setDarkMode(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  const { INK, SL, BD, LT, W } = getDarkVars(darkMode);

  const openCtxMenu = (id: string, type: "sale" | "stock", el: HTMLElement, mousePos?: { x: number; y: number }) => {
    const MENU_H = type === "sale" ? 200 : 230;
    const TAB_BAR = 80;
    const MARGIN = 10;
    const MENU_W = 220;
    let top: number, right: number;
    if (mousePos) {
      const spaceBelow = window.innerHeight - mousePos.y - TAB_BAR;
      top = spaceBelow < MENU_H ? mousePos.y - MENU_H - 6 : mousePos.y + 6;
      const rightRaw = window.innerWidth - mousePos.x;
      right = Math.min(rightRaw, window.innerWidth - MENU_W - 8);
    } else {
      const rect = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - TAB_BAR;
      const openAbove = spaceBelow < MENU_H && rect.top > MENU_H;
      top = openAbove ? rect.top - MENU_H - 6 : rect.bottom + 6;
      const maxTop = window.innerHeight - TAB_BAR - MENU_H - MARGIN;
      top = Math.min(maxTop, Math.max(MARGIN, top));
      const rightRaw = Math.max(8, window.innerWidth - rect.right);
      right = Math.min(rightRaw, window.innerWidth - MENU_W - 8);
    }
    top = Math.min(window.innerHeight - MENU_H - MARGIN, Math.max(MARGIN, top));
    right = Math.max(8, right);
    setCtxPos({ top, right });
    setCtxMenuId(id);
    setCtxMenuType(type);
    if (navigator.vibrate) navigator.vibrate(40);
  };
  const closeCtxMenu = () => { setCtxMenuId(null); setCtxMenuType(null); setCtxPos(null); };

  const makeLongPressHandlers = (id: string, type: "sale" | "stock") => ({
    onTouchStart: (e: React.TouchEvent) => {
      const el = e.currentTarget as HTMLElement;
      longPressTimer.current = setTimeout(() => openCtxMenu(id, type, el), 500);
    },
    onTouchEnd:   () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } },
    onTouchMove:  () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } },
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = e.currentTarget as HTMLElement;
      longPressTimer.current = setTimeout(() => openCtxMenu(id, type, el), 500);
    },
    onPointerUp:     () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } },
    onPointerCancel: () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } },
    onPointerLeave:  () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } },
  });

  // Shared period state — driven by SalesChartCard month navigator
  const [period, setPeriod] = useState<PeriodState>({ view: "month", monthOffset: 0, yearOffset: 0 });
  const handlePeriodChange = useCallback((p: PeriodState) => setPeriod(p), []);

  // Sales filtered by the selected period + profile (uses allSales so past years are included)
  const periodFilteredSales = useMemo(() => {
    const now = new Date();
    return allSales.filter(s => {
      if (!s.transaction_date) return false;
      if (selectedProfileId && s.profile_id !== selectedProfileId) return false;
      const d = new Date(s.transaction_date);
      if (period.view === "week") {
        const diff = (now.getTime() - d.getTime()) / 86400000;
        return diff >= 0 && diff < 7;
      }
      if (period.view === "month") {
        const target = new Date(now.getFullYear(), now.getMonth() + period.monthOffset, 1);
        return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth();
      }
      // year
      return d.getFullYear() === now.getFullYear() + period.yearOffset;
    });
  }, [allSales, period, selectedProfileId]);

  // Track window width to show/hide chart column content inline
  // (touch-action: pan-y + user-select: none on rows handles long-press without blocking iOS scroll)

  // Start with false to avoid hydration mismatch (server doesn't know window width)
  const [showChartInline, setShowChartInline] = useState<boolean>(false);
  useEffect(() => {
    const check = () => setShowChartInline(window.innerWidth <= 1200);
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

  const filteredSales = periodFilteredSales.filter(s => {
    if (statusFilter && s.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.buyer_seller || "").toLowerCase().includes(term) ||
      (s.item_name || "").toLowerCase().includes(term)
    );
  });

  const filteredStock = stockItems.filter(i => {
    if (i.status !== "available") return false;
    if (!stockSearch) return true;
    return (i.name || "").toLowerCase().includes(stockSearch.toLowerCase());
  });

  // Spotlight — calcolato sulle vendite filtrate per periodo
  const spotRevenue  = periodFilteredSales.filter(s => s.status === "closed").reduce((a, s) => a + Number(s.amount ?? 0), 0);
  const spotPending  = periodFilteredSales.filter(s => s.status === "open").reduce((a, s) => a + Number(s.amount ?? 0), 0);
  const spotCost     = periodFilteredSales.reduce((a, s) => a + Number(s.cost ?? 0), 0);
  const spotProfit   = spotRevenue + spotPending - spotCost;
  const spotMargin   = spotCost > 0 ? Math.round(((spotRevenue + spotPending - spotCost) / spotCost) * 100) : 0;

  const MONTH_NAMES_IT = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
  const periodLabel = (() => {
    const now = new Date();
    if (period.view === "week") return "Ultimi 7 giorni";
    if (period.view === "month") {
      const d = new Date(now.getFullYear(), now.getMonth() + period.monthOffset, 1);
      return `${MONTH_NAMES_IT[d.getMonth()]} ${d.getFullYear()}`;
    }
    return String(now.getFullYear() + period.yearOffset);
  })();

  const spotlightData = {
    profit:  { label: `Profitto netto · ${periodLabel}`,   value: spotProfit,            sub: `${spotMargin >= 0 ? "+" : ""}${spotMargin}% margine`,  color: spotProfit >= 0 ? "#6bb800" : RED,  subColor: spotProfit >= 0 ? "#6bb800" : RED },
    revenue: { label: `Ricavi totali · ${periodLabel}`,    value: spotRevenue + spotPending, sub: `${periodFilteredSales.filter(s=>s.status==="closed").length} chiuse · ${periodFilteredSales.filter(s=>s.status==="open").length} aperte`, color: BLU, subColor: BLU },
    cost:    { label: `Costi acquisti · ${periodLabel}`,   value: spotCost,              sub: `${periodFilteredSales.length} vendite totali`,                 color: RED,                             subColor: RED },
    pending: { label: `In sospeso · ${periodLabel}`,       value: spotPending,           sub: `${periodFilteredSales.filter(s=>s.status==="open").length} vendite aperte`,                     color: AMB,                             subColor: AMB },
  };
  const spot = spotlightData[spotlightKey];

  const plData = revenueByMonth.slice(-8).map(m => ({
    month: m.month,
    profitto: m.profitto,
    costi: m.costi,
  }));

  const ctxSaleData  = ctxMenuType === "sale"  ? filteredSales.find(s => s.id === ctxMenuId) ?? null : null;
  const ctxStockData = ctxMenuType === "stock" ? filteredStock.find(i => i.id === ctxMenuId) ?? null : null;
  // For stock context menu we also need allSales data (not just filtered period)
  const ctxSaleDataAll = ctxMenuType === "sale" ? (ctxSaleData ?? allSales.find(s => s.id === ctxMenuId) ?? null) : null;

  return (
    <>
      <style>{`

        :root {
          --dc-bg:    #ffffff;
          --dc-ink:   #111111;
          --dc-sl:    #888888;
          --dc-bd:    #EBEBEB;
          --dc-lt:    #F5F5F5;
          --dc-hover: #F5F5F5;
        }
        html.dark {
          --dc-bg:    #1e1e20;
          --dc-ink:   #f0f0f0;
          --dc-sl:    rgba(255,255,255,.45);
          --dc-bd:    rgba(255,255,255,.10);
          --dc-lt:    #27272a;
          --dc-hover: rgba(255,255,255,.07);
        }

        .fx-card {
          background: var(--dc-bg);
          border: 1px solid var(--dc-bd);
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          border-radius: 20px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          min-width: 0;
          transition: background .35s, border-color .25s;
        }
        .fx-card-green {
          background: #111111;
          border: none;
          color: #fff;
        }
        .fx-card-dark {
          background: var(--dc-bg);
          border: none;
          border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          padding: 20px 24px;
          position: relative;
          overflow: hidden;
        }
        .fx-card-label {
          font-size: 11px; font-weight: 600; color: var(--dc-sl);
          margin-bottom: 4px; text-transform: uppercase; letter-spacing: .05em;
          display: flex; align-items: center; justify-content: space-between;
          transition: color .25s;
        }
        .fx-card-green .fx-card-label { color: rgba(255,255,255,.55); }
        .fx-card-value {
          font-size: 32px; font-weight: 800;
          letter-spacing: -.04em; line-height: 1.1;
          margin-bottom: 6px; font-variant-numeric: tabular-nums;
          color: var(--dc-ink); transition: color .25s;
        }
        .fx-val-green { color: #6bb800 !important; }
        .fx-val-red   { color: #FF4D4D !important; }
        .fx-delta {
          display: inline-flex; align-items: center; gap: 3px;
          font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px;
        }
        .fx-delta-up   { color: #6bb800; background: ${darkMode ? "rgba(107,184,0,.18)" : GREEN_BG}; }
        .fx-delta-down { color: ${RED};   background: rgba(255,77,77,.08); }
        .fx-card-green .fx-delta { color: ${GREEN}; background: rgba(0,119,130,.15); }
        .fx-subtitle { font-size: 11px; color: var(--dc-sl); margin-top: 2px; }
        .fx-card-green .fx-subtitle { color: rgba(255,255,255,.55); }
        .fx-icon-circle {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .fx-wallets {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 10px; margin-top: 20px; padding-top: 16px;
          border-top: 1px solid var(--dc-bd);
        }
        .fx-wallet-item {
          padding: 10px; border-radius: 12px;
          border: 1px solid var(--dc-bd); font-size: 11px;
          background: var(--dc-bg);
        }
        .fx-table { width: 100%; border-collapse: collapse; }
        .fx-table th {
          text-align: left; padding: 10px 12px; font-size: 11px;
          font-weight: 600; color: var(--dc-sl); border-bottom: 1px solid var(--dc-bd);
          text-transform: uppercase; letter-spacing: .05em;
        }
        .fx-table td {
          padding: 14px 12px; font-size: 13px;
          border-bottom: 1px solid var(--dc-bd); color: var(--dc-ink);
        }
        .fx-table tr:last-child td { border-bottom: none; }
        .fx-table tr:hover td { background: var(--dc-lt); }
        .fx-table-dark th {
          color: var(--dc-sl); border-bottom: 1px solid var(--dc-bd);
        }
        .fx-table-dark td {
          color: var(--dc-ink); border-bottom: 1px solid var(--dc-bd);
        }
        .fx-table-dark tr:hover td { background: var(--dc-lt); }
        .fx-status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          display: inline-block; margin-right: 6px;
        }
        /* ── Pill search (desktop) ── */
        .fx-pill-search {
          display: flex; align-items: center; gap: 0;
          height: 32px; border-radius: 999px;
          border: 0.5px solid var(--dc-bd); background: #F5F5F5;
          overflow: hidden; cursor: pointer;
          transition: width .4s cubic-bezier(.4,0,.2,1), background .2s, border-color .2s;
          width: 32px; padding: 0 9px;
        }
        .fx-pill-search.open {
          width: 220px; background: var(--dc-bg); border-color: #007782; cursor: default;
        }
        .fx-pill-search input {
          flex: 1; border: none; outline: none; font-size: 13px;
          font-family: inherit; background: transparent; color: var(--dc-ink);
          width: 0; opacity: 0; pointer-events: none;
          transition: opacity .2s .15s; white-space: nowrap;
        }
        .fx-pill-search.open input { width: auto; opacity: 1; pointer-events: all; }
        .fx-pill-close {
          display: none; align-items: center; justify-content: center;
          width: 14px; height: 14px; color: var(--dc-sl); cursor: pointer;
          font-size: 13px; margin-left: 4px; flex-shrink: 0;
        }
        .fx-pill-search.open .fx-pill-close { display: flex; }
        /* ── Pill status badges (table) ── */
        .fx-pill-open {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600;
          background: #fff8ec; color: #b36b00; border: 0.5px solid #f5c14c;
          cursor: pointer; white-space: nowrap;
        }
        .fx-pill-done {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600;
          background: #f0fad0; color: #3b6d11; border: 0.5px solid #a0cc60;
          cursor: pointer; white-space: nowrap;
        }
        .fx-pill-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        /* ── Profile cell in table ── */
        .fx-prof-cell {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
        }
        .fx-prof-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600; flex-shrink: 0; overflow: hidden;
        }
        .fx-prof-name {
          font-size: 10px; color: var(--dc-sl); text-align: center;
          line-height: 1.2; word-break: break-all; max-width: 64px;
        }
        /* ── Margin toggle header ── */
        .fx-th-toggle { cursor: pointer; user-select: none; }
        .fx-th-toggle:hover { color: var(--dc-ink); }
        .fx-search-wrap {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; border: 1px solid var(--dc-bd);
          border-radius: 12px; background: var(--dc-bg); min-width: 0; max-width: 220px; flex: 1;
        }
        .fx-search-wrap input {
          border: none; outline: none; font-size: 13px;
          font-family: inherit; color: var(--dc-ink); background: transparent; width: 100%;
        }
        .fx-search-wrap input::placeholder { color: #b0b0b0; }
        .fx-search-dark {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; border: 1px solid var(--dc-bd);
          border-radius: 12px; background: var(--dc-bg); min-width: 0; max-width: 220px; flex: 1;
        }
        .fx-search-dark input {
          border: none; outline: none; font-size: 13px;
          font-family: inherit; color: var(--dc-ink); background: transparent; width: 100%;
        }
        .fx-search-dark input::placeholder { color: #b0b0b0; }
        .fx-filter-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border: 1px solid var(--dc-bd); border-radius: 999px;
          background: var(--dc-bg); font-size: 13px; font-weight: 500;
          color: var(--dc-sl); cursor: pointer; font-family: inherit;
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
          min-height: calc(100vh - 380px);
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
          background: var(--dc-ink); color: var(--dc-bg);
        }
        .fx-tab-active-magazzino {
          background: var(--dc-ink); color: var(--dc-bg);
        }
        .fx-tab-active {
          background: var(--dc-ink); color: var(--dc-bg);
        }
        .fx-tab-inactive {
          background: transparent; color: var(--dc-sl); border: none !important;
        }
        .fx-tab-inactive:hover { background: rgba(0,0,0,.06); color: var(--dc-ink); }
        .fx-stock-filter-pill {
          padding: 4px 14px; border-radius: 999px; font-size: 11px; font-weight: 600;
          cursor: pointer; border: 1px solid transparent; transition: all .15s;
          font-family: inherit;
        }
        .fx-dark-bar {
          height: 3px; border-radius: 2px; margin-top: 12px;
        }
        .fx-tooltip-wrap {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          display: block; overflow: visible; pointer-events: none;
        }
        .fx-tooltip-wrap .fx-tooltip {
          display: none; position: absolute; left: 8px; bottom: calc(100% + 5px);
          background: #ffffff; color: #111111; font-size: 11px; font-weight: 500;
          padding: 4px 10px; border-radius: 999px; white-space: nowrap;
          z-index: 9999; pointer-events: none;
          border: 1.5px solid #1a1a1a;
          box-shadow: 0 2px 8px rgba(0,0,0,0.10);
        }
        td:hover .fx-tooltip-wrap .fx-tooltip { display: block; }
        .fx-view-slide { animation: fxViewSlide 0.4s cubic-bezier(.22,.68,0,1.2) both; }
        @keyframes fxViewSlide {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .fx-view-fixed { min-height: 80px; overflow: hidden; }
        .fx-wallets-fixed { min-height: 80px; }

        /* Flip 3D per la card sinistra (toggle vendite/magazzino) */
        .fx-flip-in { animation: fxFlipIn 0.4s cubic-bezier(.22,.68,0,1.2) both; }
        @keyframes fxFlipIn {
          from { opacity: 0; transform: rotateY(-20deg) translateX(-10px); }
          to   { opacity: 1; transform: rotateY(0) translateX(0); }
        }

        /* Elastic stagger per le card destra (laterale) */
        .fx-stagger-0 { animation: fxElastic 0.5s cubic-bezier(.34,1.56,.64,1) both; animation-delay: 0ms; }
        .fx-stagger-1 { animation: fxElastic 0.5s cubic-bezier(.34,1.56,.64,1) both; animation-delay: 70ms; }
        .fx-stagger-2 { animation: fxElastic 0.5s cubic-bezier(.34,1.56,.64,1) both; animation-delay: 140ms; }
        .fx-stagger-3 { animation: fxElastic 0.5s cubic-bezier(.34,1.56,.64,1) both; animation-delay: 210ms; }
        @keyframes fxElastic {
          from { opacity: 0; transform: translateX(-28px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* Elastic stagger per le card centrali (verso l'alto) */
        .fx-up-0 { animation: fxElasticUp 0.5s cubic-bezier(.34,1.56,.64,1) both; animation-delay: 0ms; }
        .fx-up-1 { animation: fxElasticUp 0.5s cubic-bezier(.34,1.56,.64,1) both; animation-delay: 80ms; }
        .fx-up-2 { animation: fxElasticUp 0.5s cubic-bezier(.34,1.56,.64,1) both; animation-delay: 160ms; }
        .fx-up-3 { animation: fxElasticUp 0.5s cubic-bezier(.34,1.56,.64,1) both; animation-delay: 240ms; }
        @keyframes fxElasticUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 600px) {
          .fx-4cards { grid-template-columns: 1fr 1fr; }
          .fx-search-wrap { width: 100%; box-sizing: border-box; }
          .mobile-view-toggle .fx-search-wrap { width: 100% !important; }
          .fx-card-value { font-size: 24px; }

          /* ── Mobile table: hide header, show rows as cards ── */
          .fx-table thead { display: none; }
          .fx-table tbody tr {
            display: flex;
            align-items: center;
            padding: 10px 4px;
            border-bottom: 1px solid var(--dc-bd);
            gap: 0;
          }
          .fx-table tbody tr:last-child { border-bottom: none; }
          .fx-table tbody tr:hover td { background: transparent; }

          /* hide desktop-only cells on mobile */
          .fx-table td { display: none !important; padding: 0 !important; border: none !important; }

          /* show only the two mobile cells */
          .fx-table td.fx-td-main,
          .fx-table td.fx-td-right { display: flex !important; }

          .fx-td-main {
            flex: 1;
            align-items: center;
            gap: 10px;
            min-width: 0;
            max-width: none !important;
            position: static !important;
            overflow: hidden;
          }
          .fx-td-main-inner {
            display: flex;
            flex-direction: column;
            min-width: 0;
            flex: 1;
          }
          .fx-td-main-name {
            font-size: 13px;
            font-weight: 600;
            color: var(--dc-ink);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .fx-td-main-sub {
            font-size: 11px;
            color: var(--dc-sl);
            margin-top: 2px;
          }
          .fx-td-right {
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
            flex-shrink: 0;
            padding-left: 8px !important;
          }
          .fx-td-amount {
            font-size: 14px;
            font-weight: 700;
            color: var(--dc-ink);
            font-variant-numeric: tabular-nums;
          }
          .fx-status-badge {
            font-size: 10px;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 999px;
          }
        }
        @media (max-width: 420px) {
          .fx-card { padding: 16px; border-radius: 16px; }
          .fx-card-value { font-size: 20px; }
        }

        /* ── Long press context menu ── */
        .lp-row {
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          user-select: none;
        }
        .lp-row-active {
          position: relative;
        }
        .lp-row-active .lp-row-inner {
          background: rgba(0,119,130,0.06);
          border: 2px solid var(--primary);
          border-radius: 12px;
          margin: 4px 0;
          box-shadow: 0 2px 12px rgba(0,119,130,0.15);
        }
        .lp-row-active::before { display: none; }
        .lp-backdrop {
          position: fixed; inset: 0; z-index: 40;
        }
        .lp-menu {
          position: fixed;
          background: #ffffff;
          border: 0.5px solid rgba(0,0,0,0.12);
          border-radius: 16px;
          min-width: 220px;
          max-width: calc(100vw - 16px);
          z-index: 9999;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.14);
          animation: lpMenuIn 0.18s cubic-bezier(.34,1.56,.64,1) both;
        }
        @keyframes lpMenuIn {
          from { opacity: 0; transform: scale(0.92) translateY(-6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .lp-menu-header {
          padding: 11px 14px 9px;
          border-bottom: 0.5px solid var(--dc-bd);
        }
        .lp-menu-name { font-size: 12px; font-weight: 700; color: var(--dc-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
        .lp-menu-sub  { font-size: 10px; color: var(--dc-sl); margin-top: 2px; }
        .lp-menu-action {
          display: flex; align-items: center; gap: 11px;
          padding: 12px 14px; border-bottom: 0.5px solid var(--dc-bd);
          cursor: pointer; background: transparent; border-left: none; border-right: none; border-top: none;
          width: 100%; font-family: inherit; text-align: left;
          transition: background .12s;
        }
        .lp-menu-action:last-child { border-bottom: none; }
        .lp-menu-action:active { background: var(--dc-lt); }
        .lp-menu-action-label { font-size: 13px; color: var(--dc-ink); font-weight: 500; }
        .lp-menu-action-label-danger { font-size: 13px; color: #c0392b; font-weight: 500; }
        .lp-icon { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .lp-icon-green  { background: #f0f9e6; }
        .lp-icon-blue   { background: #e8f0fe; }
        .lp-icon-red    { background: #fdf0ef; }
        .lp-icon-amber  { background: #fff8ee; }
      `}</style>

      <div className="fx-grid">

        {/* ═══ LEFT COLUMN ═══ */}
        <div className="fx-left">

          {/* Profitto Totale */}
          <div className="fx-card">
            <div className="fx-card-label">
              <span>{activeView === "magazzino" ? "Articoli in stock" : "Profitto Totale"}</span>
              <span style={{ fontSize: 11, color: SL, display: "flex", alignItems: "center", gap: 4 }}>
                {activeView === "magazzino" ? <Package size={13} color={BLU} /> : <span style={{ fontSize: 11, color: SL }}>All time</span>}
              </span>
            </div>
            <div className="fx-view-fixed">
              <div key={viewAnimKey} className="fx-flip-in">
                {activeView === "magazzino" ? (
                  <>
                    <div className="fx-card-value" style={{ color: BLU }}>{stockCount}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <span className="fx-delta" style={{ color: BLU, background: darkMode ? "rgba(59,130,246,.18)" : "#dbeafe" }}>
                        <ArrowUpRight size={12} /> {ytdStockCount} quest&apos;anno
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`fx-card-value ${profit >= 0 ? "fx-val-green" : "fx-val-red"}`}>€{fmt(profit)}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <span className={`fx-delta ${avgMargin >= 0 ? "fx-delta-up" : "fx-delta-down"}`}>
                        {avgMargin >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {avgMargin}%
                      </span>
                      <span className="fx-subtitle">margine sul costo</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Toggle Vendite / Magazzino */}
            <div style={{ display: "flex", background: darkMode ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.07)", borderRadius: 999, padding: 3 }}>
              <button
                className={`fx-tab-btn ${activeView === "vendite" ? "fx-tab-active-vendite" : "fx-tab-inactive"}`}
                onClick={() => { setActiveView("vendite"); setViewAnimKey(k => k + 1); }}
              >
                <ShoppingBag size={14} /> Vendite
              </button>
              <button
                className={`fx-tab-btn ${activeView === "magazzino" ? "fx-tab-active-magazzino" : "fx-tab-inactive"}`}
                onClick={() => { setActiveView("magazzino"); setViewAnimKey(k => k + 1); }}
              >
                <Package size={14} /> Magazzino
              </button>
            </div>

            <div className="fx-wallets-fixed">
            <div key={viewAnimKey + 100} className="fx-flip-in">
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
                  <div style={{ fontWeight: 700, fontSize: 13, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>€{(ytdRevenue + ytdPending) >= 1000 ? ((ytdRevenue + ytdPending)/1000).toFixed(1)+"k" : fmt(ytdRevenue + ytdPending)}</div>
                  <div style={{ color: SL, marginTop: 2, fontSize: 10 }}>Ricavi totali</div>
                  <div style={{ fontSize: 10, color: BLU, fontWeight: 600, marginTop: 4 }}>YTD</div>
                </div>
              </>) : (<>
                <div className="fx-wallet-item">
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#6bb800", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>€{potentialStockValue >= 1000 ? (potentialStockValue/1000).toFixed(1)+"k" : fmt(potentialStockValue)}</div>
                  <div style={{ color: SL, marginTop: 2, fontSize: 10 }}>Val. Potenziale</div>
                  <div style={{ fontSize: 10, color: "#6bb800", fontWeight: 600, marginTop: 4 }}>Stock</div>
                </div>
                <div className="fx-wallet-item">
                  <div style={{ fontWeight: 700, fontSize: 13, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>€{stockCost >= 1000 ? (stockCost/1000).toFixed(1)+"k" : fmt(stockCost)}</div>
                  <div style={{ color: SL, marginTop: 2, fontSize: 10 }}>Costo totale</div>
                  <div style={{ fontSize: 10, color: RED, fontWeight: 600, marginTop: 4 }}>Uscite</div>
                </div>
                <div className="fx-wallet-item">
                  <div style={{ fontWeight: 700, fontSize: 13, color: staleItems > 0 ? AMB : INK }}>{staleItems}</div>
                  <div style={{ color: SL, marginTop: 2, fontSize: 10 }}>Fermi &gt;60gg</div>
                  <div style={{ fontSize: 10, color: staleItems > 0 ? AMB : SL, fontWeight: 600, marginTop: 4 }}>Clearance</div>
                </div>
              </>)}
            </div>
            </div>
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

        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="fx-right">

          {/* Mobile toggle — always visible on mobile, above content */}
          <div className="mobile-view-toggle" style={{ flexShrink: 0 }}>
            <div style={{ display: "flex", background: darkMode ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.07)", borderRadius: 999, padding: 3 }}>
              <button
                onClick={() => { setActiveView("vendite"); setViewAnimKey(k => k + 1); }}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 999, border: "none",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: activeView === "vendite" ? (darkMode ? "#f0f0f0" : "#111") : "transparent",
                  color: activeView === "vendite" ? (darkMode ? "#111" : "#fff") : (darkMode ? "rgba(255,255,255,.45)" : "rgba(0,0,0,.45)"),
                  transition: "all .18s",
                }}
              >Vendite</button>
              <button
                onClick={() => { setActiveView("magazzino"); setViewAnimKey(k => k + 1); }}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 999, border: "none",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: activeView === "magazzino" ? (darkMode ? "#f0f0f0" : "#111") : "transparent",
                  color: activeView === "magazzino" ? (darkMode ? "#111" : "#fff") : (darkMode ? "rgba(255,255,255,.45)" : "rgba(0,0,0,.45)"),
                  transition: "all .18s",
                }}
              >Magazzino</button>
            </div>
          </div>

          {/* ── VISTA VENDITE ── */}
          {activeView === "vendite" && (
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 0 }}>
              {/* Spotlight */}
              <div key={`spot-${viewAnimKey}`} className="fx-up-0 mobile-hide" style={{ flexShrink: 0 }}>
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
              </div>

              {/* Tabella Attività Recenti */}
              <div key={`recenti-${viewAnimKey}`} className="fx-up-1" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>

                {/* Header mobile: fuori dalla card */}
                <div className="mobile-flex-header" style={{ marginBottom: 8, padding: "0 2px" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: INK, letterSpacing: "-.02em" }}>Attività Recenti</div>
                  <div
                    className={`fx-pill-search${searchOpen ? " open" : ""}`}
                    onClick={() => { if (!searchOpen) { setSearchOpen(true); setTimeout(() => { const el = document.getElementById("mob-search-input"); if (el) el.focus(); }, 420); } }}
                  >
                    <Search size={14} color="#007782" style={{ flexShrink: 0 }} />
                    <input
                      id="mob-search-input"
                      type="text"
                      placeholder="Cerca nel registro..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      onClick={e => e.stopPropagation()}
                    />
                    <span className="fx-pill-close" onClick={e => { e.stopPropagation(); setSearchOpen(false); setSearchTerm(""); }}>✕</span>
                  </div>
                </div>

              <div className="fx-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>

                {/* Header desktop: dentro la card */}
                <div className="mobile-hide" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>Attività Recenti</div>
                  <div
                    className={`fx-pill-search${searchPillOpen ? " open" : ""}`}
                    onClick={() => { if (!searchPillOpen) { setSearchPillOpen(true); setTimeout(() => { const el = document.getElementById("dc-search-input"); if (el) el.focus(); }, 420); } }}
                  >
                    <Search size={14} color={searchPillOpen ? "#007782" : "#007782"} style={{ flexShrink: 0 }} />
                    <input
                      id="dc-search-input"
                      type="text"
                      placeholder="Cerca nel registro..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      onClick={e => e.stopPropagation()}
                    />
                    <span className="fx-pill-close" onClick={e => { e.stopPropagation(); setSearchPillOpen(false); setSearchTerm(""); }}>✕</span>
                  </div>
                </div>
                {/* ── MOBILE list (hidden on desktop) ── */}
                <div className="mobile-view-toggle fx-mobile-list-wrap">
                <div ref={salesListRef} className="mobile-view-toggle fx-mobile-list">
                  {filteredSales.length === 0 ? (
                    <div style={{ textAlign: "center", color: SL, padding: "32px 12px", fontSize: 13 }}>
                      {periodFilteredSales.length === 0 ? "Nessuna vendita nel periodo" : "Nessun risultato"}
                    </div>
                  ) : filteredSales.map((sale, i) => {
                    const sMeta = STATUS_META[sale.status || "open"] || STATUS_META.open;
                    const dateStr = sale.transaction_date
                      ? new Date(sale.transaction_date).toLocaleDateString("it", { day: "2-digit", month: "2-digit", year: "numeric" })
                      : "—";
                    const amount = Number(sale.amount ?? 0);
                    const cost   = Number(sale.cost ?? 0);
                    const marginAbs = amount - cost;
                    const photoUrl = sale.template_id_ext ? photoMap[sale.template_id_ext] : null;
                    const prof = profiles.find((p: any) => p.id === sale.profile_id || p.name === sale.profile_id);
                    const saleId = sale.id ?? "";
                    const isCtxOpen = ctxMenuId === saleId && ctxMenuType === "sale";
                    const isOpen = sale.status === "open" || !sale.status;
                    const isClosed = sale.status === "closed";
                    return (
                      <div
                        key={sale.id || i}
                        className={`lp-row${isCtxOpen ? " lp-row-active" : ""}`}
                        style={{ position: "relative", userSelect: "none", touchAction: "pan-y" }}
                        {...makeLongPressHandlers(saleId, "sale")}
                      >
                        {/* Divisore sfumato sopra (non sul primo, non quando la riga corrente o precedente è attiva) */}
                        {i > 0 && !isCtxOpen && ctxMenuId !== (filteredSales[i - 1]?.id ?? "") && (
                          <div style={{ height: "0.5px", background: `linear-gradient(90deg, transparent, ${BD} 15%, ${BD} 85%, transparent)`, margin: "0 2px" }} />
                        )}
                        {/* Riga principale */}
                        <div className="lp-row-inner" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 2px" }}>
                          {/* Thumbnail */}
                          {photoUrl ? (
                            <img src={photoUrl} alt="" style={{ width: 50, height: 50, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 50, height: 50, borderRadius: 12, background: LT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <ShoppingBag size={18} color={SL} />
                            </div>
                          )}
                          {/* Contenuto: due righe */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Riga 1: nome + prezzo */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                                {sale.buyer_seller || sale.item_name || "Vendita"}
                              </span>
                              <span style={{ fontSize: 15, fontWeight: 800, color: INK, fontVariantNumeric: "tabular-nums", letterSpacing: "-.02em", flexShrink: 0 }}>
                                €{fmt(amount)}
                              </span>
                            </div>
                            {/* Riga 2: data + badge + margine */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {prof && (
                                  prof.avatar_url
                                    ? <img src={prof.avatar_url} alt="" style={{ width: 15, height: 15, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                                    : <div style={{ width: 15, height: 15, borderRadius: "50%", background: "#007782", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{prof.name.charAt(0).toUpperCase()}</div>
                                )}
                                <span style={{ fontSize: 11, color: SL }}>{dateStr}</span>
                                <span
                                  onClick={() => setStatusFilter(statusFilter === (sale.status || "open") ? null : (sale.status || "open"))}
                                  className={isClosed ? "fx-pill-done" : "fx-pill-open"}
                                  style={{ fontSize: 10, padding: "2px 8px", opacity: statusFilter && statusFilter !== (sale.status || "open") ? 0.4 : 1, transition: "opacity .15s" }}
                                >
                                  <span className="fx-pill-dot" style={{ background: isClosed ? "#6bb800" : "#f5a623" }} />
                                  {sMeta.label}
                                </span>
                              </div>
                              {cost > 0 && (
                                <span
                                  style={{ fontSize: 12, fontWeight: 700, color: marginAbs >= 0 ? "#6bb800" : RED, fontVariantNumeric: "tabular-nums", cursor: "pointer", flexShrink: 0 }}
                                  onClick={() => setShowPctMargin(v => !v)}
                                >
                                  {showPctMargin
                                    ? `${marginAbs >= 0 ? "▲" : "▼"} ${cost > 0 ? Math.round(((amount - cost) / cost) * 100) : 0}%`
                                    : `${marginAbs >= 0 ? "+" : ""}€${fmt(marginAbs)}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
                </div>

                {/* ── DESKTOP table (hidden on mobile) ── */}
                <div className="fx-recent-scroll mobile-hide" style={{ flex: 1, minHeight: 0 }}>
                  <table className="fx-table">
                    <thead>
                      <tr>
                        <th style={{ width: 72 }}>Data</th>
                        <th style={{ width: 58, textAlign: "center" }}>Profilo</th>
                        <th>Articolo</th>
                        <th style={{ width: 66 }}>Acquisto</th>
                        <th style={{ width: 100, textAlign: "center" }}>Stato</th>
                        <th style={{ width: 84, textAlign: "right", cursor: "pointer", userSelect: "none" }} onClick={() => setShowPctMargin(v => !v)}>
                          Vendita
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: "center", color: SL, padding: "32px 12px" }}>
                            {periodFilteredSales.length === 0 ? "Nessuna vendita nel periodo" : "Nessun risultato"}
                          </td>
                        </tr>
                      ) : (
                        filteredSales.map((sale, i) => {
                          const isOpen = sale.status === "open" || !sale.status;
                          const dateStr = sale.transaction_date
                            ? new Date(sale.transaction_date).toLocaleDateString("it", { day: "2-digit", month: "2-digit", year: "numeric" })
                            : "—";
                          const amount = Number(sale.amount ?? 0);
                          const cost   = Number(sale.cost ?? 0);
                          const marginAbs = amount - cost;
                          const marginPct = cost > 0 ? Math.round(((amount - cost) / cost) * 100) : 0;
                          const photoUrl = sale.template_id_ext ? photoMap[sale.template_id_ext] : null;
                          const prof = profiles.find((p: any) => p.id === sale.profile_id || p.name === sale.profile_id);
                          const profName = prof?.name ?? "—";
                          const profInitial = profName.charAt(0).toUpperCase();
                          const profColors = ["#007782","#9b59b6","#e67e22","#2980b9","#27ae60"];
                          const profColorIdx = profName.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % profColors.length;
                          const profColor = profColors[profColorIdx];
                          return (
                            <tr
                              key={sale.id || i}
                              style={{ cursor: "pointer" }}
                              onClick={(e) => {
                                const sId = sale.id ?? "";
                                if (ctxMenuId === sId) { closeCtxMenu(); return; }
                                openCtxMenu(sId, "sale", e.currentTarget as HTMLElement, { x: e.clientX, y: e.clientY });
                              }}
                            >
                              <td style={{ fontSize: 12, color: SL, whiteSpace: "nowrap" }}>{dateStr}</td>
                              <td>
                                <div className="fx-prof-cell">
                                  {prof?.avatar_url ? (
                                    <img src={prof.avatar_url} alt="" className="fx-prof-avatar" style={{ objectFit: "cover" }} />
                                  ) : (
                                    <div className="fx-prof-avatar" style={{ background: `${profColor}18`, color: profColor }}>
                                      {profInitial}
                                    </div>
                                  )}
                                  <span className="fx-prof-name">{profName}</span>
                                </div>
                              </td>
                              <td style={{ maxWidth: 0, position: "relative" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  {photoUrl ? (
                                    <img src={photoUrl} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                                  ) : (
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: LT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <ShoppingBag size={14} color={SL} />
                                    </div>
                                  )}
                                  <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0, display: "block" }}>
                                    {(sale.buyer_seller || sale.item_name || "Vendita").slice(0, 40)}
                                  </span>
                                </div>
                                <span className="fx-tooltip-wrap">
                                  <span className="fx-tooltip">{sale.buyer_seller || sale.item_name || "Vendita"}</span>
                                </span>
                              </td>
                              <td style={{ fontSize: 13, color: SL, fontVariantNumeric: "tabular-nums" }}>
                                {cost > 0 ? `€${fmt(cost)}` : "—"}
                              </td>
                              <td>
                                <span
                                  className={isOpen ? "fx-pill-open" : "fx-pill-done"}
                                  style={{ opacity: statusFilter && statusFilter !== (sale.status || "open") ? 0.4 : 1, transition: "opacity .15s" }}
                                  onClick={(e) => { e.stopPropagation(); setStatusFilter(statusFilter === (sale.status || "open") ? null : (sale.status || "open")); }}
                                >
                                  <span className="fx-pill-dot" style={{ background: isOpen ? "#f5a623" : "#6bb800" }} />
                                  {isOpen ? "In sospeso" : "Completato"}
                                </span>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <div style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: INK }}>€{fmt(amount)}</div>
                                <div
                                  style={{ fontSize: 11, fontWeight: 600, marginTop: 2, color: marginAbs >= 0 ? "#6bb800" : RED, fontVariantNumeric: "tabular-nums", cursor: "pointer" }}
                                  onClick={(e) => { e.stopPropagation(); setShowPctMargin(v => !v); }}
                                >
                                  {showPctMargin
                                    ? `${marginPct >= 0 ? "▲" : "▼"} ${Math.abs(marginPct)}%`
                                    : `${marginAbs >= 0 ? "+" : ""}€${fmt(marginAbs)}`}
                                </div>
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* ── VISTA MAGAZZINO ── */}
          {activeView === "magazzino" && (
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 0 }}>
              {/* Tabella Stock Magazzino */}
              <div key={`stock-${viewAnimKey}`} className="fx-up-0" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>

                {/* Header mobile: fuori dalla card */}
                <div className="mobile-flex-header" style={{ marginBottom: 8, padding: "0 2px" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: INK, letterSpacing: "-.02em" }}>Stock Magazzino</div>
                  <div
                    className={`fx-pill-search${stockSearchOpen ? " open" : ""}`}
                    onClick={() => { if (!stockSearchOpen) { setStockSearchOpen(true); setTimeout(() => { const el = document.getElementById("mob-stock-input"); if (el) el.focus(); }, 420); } }}
                  >
                    <Search size={14} color="#007782" style={{ flexShrink: 0 }} />
                    <input
                      id="mob-stock-input"
                      type="text"
                      placeholder="Cerca nel magazzino..."
                      value={stockSearch}
                      onChange={e => setStockSearch(e.target.value)}
                      onClick={e => e.stopPropagation()}
                    />
                    <span className="fx-pill-close" onClick={e => { e.stopPropagation(); setStockSearchOpen(false); setStockSearch(""); }}>✕</span>
                  </div>
                </div>

              <div className="fx-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                {/* Header desktop: dentro la card */}
                <div className="mobile-hide" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>Stock Magazzino</div>
                  <div
                    className={`fx-pill-search${stockPillOpen ? " open" : ""}`}
                    onClick={() => { if (!stockPillOpen) { setStockPillOpen(true); setTimeout(() => { const el = document.getElementById("dc-stock-input"); if (el) el.focus(); }, 420); } }}
                  >
                    <Search size={14} color="#007782" style={{ flexShrink: 0 }} />
                    <input
                      id="dc-stock-input"
                      type="text"
                      placeholder="Cerca articolo..."
                      value={stockSearch}
                      onChange={e => setStockSearch(e.target.value)}
                      onClick={e => e.stopPropagation()}
                    />
                    <span className="fx-pill-close" onClick={e => { e.stopPropagation(); setStockPillOpen(false); setStockSearch(""); }}>✕</span>
                  </div>
                </div>
                {/* ── MOBILE stock list ── */}
                <div className="mobile-view-toggle fx-mobile-list-wrap">
                <div ref={stockListRef} className="mobile-view-toggle fx-mobile-list">
                  {filteredStock.length === 0 ? (
                    <div style={{ textAlign: "center", color: SL, padding: "32px 12px", fontSize: 13 }}>Nessun articolo trovato</div>
                  ) : filteredStock.map((item, i) => {
                    const photoUrl = item.template_id_ext ? photoMap[item.template_id_ext] : null;
                    const cost = Number(item.purchase_price ?? 0);
                    const price = Number(item.potentialPrice ?? 0);
                    const marginAbs = price - cost;
                    const days = item.purchased_at ? Math.floor((Date.now() - new Date(item.purchased_at).getTime()) / 86400000) : null;
                    const isStale = days !== null && days > 60;
                    const stockId = item.id ?? "";
                    const isCtxOpen = ctxMenuId === stockId && ctxMenuType === "stock";
                    return (
                      <div
                        key={item.id || i}
                        className={`lp-row${isCtxOpen ? " lp-row-active" : ""}`}
                        style={{ position: "relative", userSelect: "none", touchAction: "pan-y" }}
                        {...makeLongPressHandlers(stockId, "stock")}
                      >
                        {/* Divisore sfumato sopra (non sul primo, non quando la riga corrente o precedente è attiva) */}
                        {i > 0 && !isCtxOpen && ctxMenuId !== (filteredStock[i - 1]?.id ?? "") && (
                          <div style={{ height: "0.5px", background: `linear-gradient(90deg, transparent, ${BD} 15%, ${BD} 85%, transparent)`, margin: "0 2px" }} />
                        )}
                        <div className="lp-row-inner" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 2px" }}>
                          {/* Thumbnail */}
                          {photoUrl ? (
                            <img src={photoUrl} alt="" style={{ width: 50, height: 50, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 50, height: 50, borderRadius: 12, background: LT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Package size={18} color={SL} />
                            </div>
                          )}
                          {/* Contenuto: due righe */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Riga 1: nome + prezzo potenziale */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                                {item.name || "Articolo"}
                              </span>
                              <span style={{ fontSize: 15, fontWeight: 800, color: INK, fontVariantNumeric: "tabular-nums", letterSpacing: "-.02em", flexShrink: 0 }}>
                                {price > 0 ? `€${fmt(price)}` : "—"}
                              </span>
                            </div>
                            {/* Riga 2: taglia + giorni + margine / clearance */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                {item.size && <span style={{ fontSize: 11, color: SL }}>{item.size}</span>}
                                {item.size && days !== null && <span style={{ fontSize: 11, color: SL }}>·</span>}
                                {days !== null && (
                                  <span style={{ fontSize: 11, color: isStale ? AMB : SL, display: "flex", alignItems: "center", gap: 3 }}>
                                    {isStale && <AlertTriangle size={10} />}{days}gg
                                  </span>
                                )}
                                {isStale && (
                                  <span style={{ fontSize: 10, fontWeight: 600, color: AMB, background: darkMode ? "rgba(245,166,35,.18)" : "#fef3c7", padding: "2px 7px", borderRadius: 999, marginLeft: 2 }}>
                                    clearance
                                  </span>
                                )}
                              </div>
                              {price > 0 && cost > 0 && (
                                <span style={{ fontSize: 12, fontWeight: 700, color: marginAbs >= 0 ? "#6bb800" : RED, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                                  {marginAbs >= 0 ? "+" : ""}€{fmt(marginAbs)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
                </div>

                {/* ── DESKTOP stock table ── */}
                <div className="fx-recent-scroll mobile-hide" style={{ flex: 1, minHeight: 0 }}>
                  <table className="fx-table" style={{ tableLayout: "fixed", width: "100%" }}>
                    <colgroup>
                      <col style={{ width: "40%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "18%" }} />
                      <col style={{ width: "18%" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Articolo</th>
                        <th style={{ textAlign: "center" }}>Taglia</th>
                        <th style={{ textAlign: "right" }}>Costo</th>
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
                          const stockId = item.id ?? "";

                          return (
                            <tr
                              key={item.id || i}
                              style={{ cursor: "pointer" }}
                              onClick={(e) => {
                                if (ctxMenuId === stockId) { closeCtxMenu(); return; }
                                openCtxMenu(stockId, "stock", e.currentTarget as HTMLElement, { x: e.clientX, y: e.clientY });
                              }}
                            >
                              <td style={{ maxWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                                  {photoUrl ? (
                                    <img src={photoUrl} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                                  ) : (
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: LT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <Package size={14} color={SL} />
                                    </div>
                                  )}
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, color: INK }}>
                                      {item.name || "Articolo"}
                                    </div>
                                    {isStale && (
                                      <span style={{ fontSize: 10, fontWeight: 700, color: AMB, background: darkMode ? "rgba(245,166,35,.18)" : "#fef3c7", padding: "1px 6px", borderRadius: 999, display: "inline-block", marginTop: 2 }}>
                                        clearance
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td style={{ fontSize: 12, color: SL, textAlign: "center" }}>{item.size || "—"}</td>
                              <td style={{ textAlign: "right", fontSize: 13, color: SL, fontVariantNumeric: "tabular-nums" }}>
                                {cost > 0 ? `€${fmt(cost)}` : "—"}
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <div style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: INK, fontSize: 13 }}>
                                  {price > 0 ? `€${fmt(price)}` : "—"}
                                </div>
                                {price > 0 && cost > 0 && (
                                  <div style={{ fontSize: 11, fontWeight: 600, color: marginAbs >= 0 ? "#6bb800" : RED, fontVariantNumeric: "tabular-nums", marginTop: 1 }}>
                                    {marginAbs >= 0 ? "+" : ""}€{fmt(marginAbs)}
                                  </div>
                                )}
                              </td>
                              <td style={{ textAlign: "right" }}>
                                {days !== null && (
                                  <span style={{
                                    fontSize: 11, fontWeight: 600,
                                    padding: "3px 8px", borderRadius: 999,
                                    background: isStale ? (darkMode ? "rgba(245,166,35,.18)" : "#fef3c7") : LT,
                                    color: isStale ? AMB : SL,
                                    display: "inline-flex", alignItems: "center", gap: 3,
                                  }}>
                                    {isStale && <AlertTriangle size={9} />}
                                    {days}gg
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              </div>

            </div>
          )}

          {/* Card sotto attività recenti — desktop 3-col, mobile 1-col */}
          {activeView === "vendite" && (
            <div className="fx-bottom-cards" style={{ flexShrink: 0, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
              <AvgTicketCard sales={allSales} selectedProfileId={selectedProfileId} />
              <div style={{ background: "var(--white)", borderRadius: 20, border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", padding: "18px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 100 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: LT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#CCCCCC" strokeWidth="1.3"/><path d="M8 5v3.5M8 10.5v.5" stroke="#CCCCCC" strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Prossimamente</div>
                <div style={{ fontSize: 11, color: "var(--slate)", textAlign: "center" }}>Nuove funzionalità in arrivo</div>
              </div>
              <div style={{ background: "var(--white)", borderRadius: 20, border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", padding: "18px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 100 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: LT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#CCCCCC" strokeWidth="1.3"/><path d="M8 5v3.5M8 10.5v.5" stroke="#CCCCCC" strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Prossimamente</div>
                <div style={{ fontSize: 11, color: "var(--slate)", textAlign: "center" }}>Nuove funzionalità in arrivo</div>
              </div>
            </div>
          )}
          {activeView === "magazzino" && (
            <div className="fx-bottom-cards" style={{ flexShrink: 0, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
              <AvgTicketCard sales={allSales} selectedProfileId={selectedProfileId} defaultView="acquisto" />
              <div style={{ background: "var(--white)", borderRadius: 20, border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", padding: "18px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 100 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: LT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#CCCCCC" strokeWidth="1.3"/><path d="M8 5v3.5M8 10.5v.5" stroke="#CCCCCC" strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Prossimamente</div>
                <div style={{ fontSize: 11, color: "var(--slate)", textAlign: "center" }}>Nuove funzionalità in arrivo</div>
              </div>
              <div style={{ background: "var(--white)", borderRadius: 20, border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", padding: "18px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 100 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: LT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#CCCCCC" strokeWidth="1.3"/><path d="M8 5v3.5M8 10.5v.5" stroke="#CCCCCC" strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Prossimamente</div>
                <div style={{ fontSize: 11, color: "var(--slate)", textAlign: "center" }}>Nuove funzionalità in arrivo</div>
              </div>
            </div>
          )}

        </div>

        {/* ═══ RIGHT CHART COLUMN ═══ */}
        <div className="fx-chart">
          {activeView === "vendite" ? (
            <>
              <div key={`vendite-${viewAnimKey}-0`} className="fx-stagger-0"><SalesChartCard sales={allSales} onPeriodChange={handlePeriodChange} /></div>
              <div key={`vendite-${viewAnimKey}-1`} className="fx-stagger-1"><CashFlowInChart kpi={kpi} /></div>
              <div key={`vendite-${viewAnimKey}-2`} className="fx-stagger-2"><TopProductsCard sales={allSales} photoMap={photoMap} stockItems={stockItems} selectedProfileId={selectedProfileId} /></div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, minHeight: 0, height: "100%" }}>
              <div key={`magazzino-${viewAnimKey}-0`} className="fx-stagger-0" style={{ flexShrink: 0 }}><ConversionRateCard sold={allClosedSales} pending={allPendingSales} available={stockCount} staleItems={staleItems} /></div>
              {(() => {
                const staleList = stockItems
                  .filter(i => i.status === "available" && i.purchased_at && Math.floor((nowTs - new Date(i.purchased_at).getTime()) / 86400000) > 60)
                  .sort((a, b) => new Date(a.purchased_at!).getTime() - new Date(b.purchased_at!).getTime());
                return (
                  <div key={`magazzino-${viewAnimKey}-1`} className="fx-stagger-1 fx-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>Clearance</div>
                      {staleList.length > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: AMB }}>{staleList.length}</span>
                      )}
                    </div>
                    {staleList.length === 0 ? (
                      <div style={{ padding: "24px 0", fontSize: 13, color: SL, textAlign: "center" }}>Nessun articolo fermo da più di 60 giorni</div>
                    ) : (
                      <div className="fx-recent-scroll" style={{ flex: 1, minHeight: 0, overflowX: "hidden" }}>
                      <table className="fx-table" style={{ tableLayout: "fixed", width: "100%" }}>
                          <colgroup>
                            <col style={{ width: 44 }} />
                            <col />
                            <col style={{ width: 52 }} />
                          </colgroup>
                          <thead>
                            <tr>
                              <th></th>
                              <th>Articolo</th>
                              <th style={{ textAlign: "right" }}>Giorni</th>
                            </tr>
                          </thead>
                          <tbody>
                            {staleList.map((item, i) => {
                              const days = Math.floor((nowTs - new Date(item.purchased_at!).getTime()) / 86400000);
                              const photoUrl = item.template_id_ext ? photoMap[item.template_id_ext] : null;
                              return (
                                <tr key={item.id || i}>
                                  <td style={{ paddingRight: 0 }}>
                                    {photoUrl ? (
                                      <img src={photoUrl} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover", border: "none", display: "block" }} />
                                    ) : (
                                      <div style={{ width: 36, height: 36, borderRadius: 10, background: LT, display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
                                        <Package size={14} color={SL} />
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ overflow: "visible", position: "relative" }}>
                                    <div style={{ fontWeight: 500, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {item.name || "Articolo"}
                                    </div>
                                    {(item.name || "").length > 0 && (
                                      <span className="fx-tooltip-wrap">
                                        <span className="fx-tooltip">{item.name}</span>
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: AMB }}>{days}gg</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* ── Global context menu portal (position: fixed, escapes overflow) ── */}
      {ctxMenuId && ctxPos && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={closeCtxMenu} />
          <div
            className="lp-menu"
            style={{ top: ctxPos.top, right: ctxPos.right, maxHeight: "60vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            {ctxMenuType === "sale" && ctxSaleDataAll && (() => {
              const s = ctxSaleDataAll;
              const amount = Number(s.amount ?? 0);
              const isOpen = s.status === "open" || !s.status;
              const saleId = s.id ?? "";
              return (
                <>
                  <div className="lp-menu-header">
                    <div className="lp-menu-name">{s.buyer_seller || s.item_name || "Vendita"}</div>
                    <div className="lp-menu-sub">€{fmt(amount)} · {isOpen ? "In sospeso" : "Completato"}</div>
                  </div>
                  {isOpen && (
                    <button className="lp-menu-action" onClick={() => {
                      closeCtxMenu();
                      startTransition(() => changeSaleStatus(saleId, "closed").then(() => window.location.reload()));
                    }}>
                      <div className="lp-icon lp-icon-green">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8.5l4 4 8-8" stroke="#3d6e00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span className="lp-menu-action-label">Completa la vendita</span>
                    </button>
                  )}
                  <button className="lp-menu-action" onClick={() => { closeCtxMenu(); setModalSale(s as any); }}>
                    <div className="lp-icon lp-icon-blue">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 11.5V14h2.5l7.1-7.1-2.5-2.5L2 11.5z" stroke="#185FA5" strokeWidth="1.3" strokeLinejoin="round"/><path d="M11.5 2.5l2 2" stroke="#185FA5" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    </div>
                    <span className="lp-menu-action-label">Modifica</span>
                  </button>
                  <button className="lp-menu-action" onClick={() => {
                    closeCtxMenu();
                    startTransition(() => deleteSale(saleId).then(() => window.location.reload()));
                  }}>
                    <div className="lp-icon lp-icon-red">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="#c0392b" strokeWidth="1.6" strokeLinecap="round"/></svg>
                    </div>
                    <span className="lp-menu-action-label-danger">Annulla la vendita</span>
                  </button>
                </>
              );
            })()}
            {ctxMenuType === "stock" && ctxStockData && (() => {
              const item = ctxStockData;
              const cost = Number(item.purchase_price ?? 0);
              return (
                <>
                  <div className="lp-menu-header">
                    <div className="lp-menu-name">{item.name || "Articolo"}</div>
                    <div className="lp-menu-sub">{cost > 0 ? `€${fmt(cost)} costo` : "In stock"}{item.size ? ` · ${item.size}` : ""}</div>
                  </div>
                  <button className="lp-menu-action" onClick={() => { closeCtxMenu(); setModalSell(item); }}>
                    <div className="lp-icon lp-icon-green">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M1.5 1.5h2l2.4 7.3h6.6l1.6-4.6H5.3" stroke="#3d6e00" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="13" r="1.1" fill="#3d6e00"/><circle cx="11.5" cy="13" r="1.1" fill="#3d6e00"/></svg>
                    </div>
                    <span className="lp-menu-action-label">Segna come venduto</span>
                  </button>
                  <button className="lp-menu-action" onClick={() => { closeCtxMenu(); setModalBundle(item.id ?? null); }}>
                    <div className="lp-icon" style={{ background: "rgba(0,119,130,.1)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#005f69" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    </div>
                    <span className="lp-menu-action-label" style={{ color: "#005f69", fontWeight: 700 }}>Crea bundle</span>
                  </button>
                  <button className="lp-menu-action" onClick={() => { closeCtxMenu(); setModalStock(item); }}>
                    <div className="lp-icon lp-icon-blue">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 11.5V14h2.5l7.1-7.1-2.5-2.5L2 11.5z" stroke="#185FA5" strokeWidth="1.3" strokeLinejoin="round"/><path d="M11.5 2.5l2 2" stroke="#185FA5" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    </div>
                    <span className="lp-menu-action-label">Modifica</span>
                  </button>
                  <button className="lp-menu-action" onClick={() => {
                    closeCtxMenu();
                    startTransition(() => deleteStockItem(item.id ?? "").then(() => window.location.reload()));
                  }}>
                    <div className="lp-icon lp-icon-red">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 4h11M6 4V2.5h4V4M3.5 4l.7 9h8.6l.7-9" stroke="#c0392b" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span className="lp-menu-action-label-danger">Elimina articolo</span>
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* ── Context menu modals ── */}
      {modalSale && (
        <SaleModal
          mode="edit"
          sale={{
            id:               modalSale.id ?? "",
            buyer_seller:     modalSale.buyer_seller ?? null,
            amount:           modalSale.amount ?? null,
            cost:             modalSale.cost ?? null,
            platform:         null,
            status:           modalSale.status ?? null,
            notes:            null,
            transaction_date: modalSale.transaction_date ?? null,
            template_id_ext:  modalSale.template_id_ext ?? null,
            profile_id:       modalSale.profile_id ?? null,
          }}
          profiles={profiles.map(p => ({ id: p.id, name: p.name }))}
          onClose={() => { setModalSale(null); window.location.reload(); }}
        />
      )}
      {modalStock && (
        <StockEditModal
          item={{
            id:             modalStock.id ?? "",
            name:           modalStock.name ?? null,
            size:           modalStock.size ?? null,
            quantity:       modalStock.quantity ?? null,
            purchase_price: modalStock.purchase_price ?? null,
            purchased_at:   modalStock.purchased_at ?? null,
            location:       null,
            status:         modalStock.status ?? null,
            template_id_ext: modalStock.template_id_ext ?? null,
            profile_id:     modalStock.profile_id ?? null,
          }}
          thumb={modalStock.template_id_ext ? (photoMap[modalStock.template_id_ext] ?? null) : null}
          profiles={profiles.map(p => ({ id: p.id, name: p.name }))}
          onClose={() => { setModalStock(null); window.location.reload(); }}
        />
      )}
      {modalSell && (
        <SellModal
          item={{
            id:              modalSell.id ?? "",
            name:            modalSell.name ?? null,
            purchase_price:  modalSell.purchase_price ?? null,
            template_id_ext: modalSell.template_id_ext ?? null,
            profile_id:      modalSell.profile_id ?? null,
            size:            modalSell.size ?? null,
          }}
          thumb={modalSell.template_id_ext ? (photoMap[modalSell.template_id_ext] ?? null) : null}
          onClose={() => { setModalSell(null); window.location.reload(); }}
        />
      )}
      {modalBundle !== undefined && modalBundle !== null && (
        <BundleModal
          availableItems={stockItems
            .filter(i => i.status === "available" && i.id)
            .map(i => ({
              id:             i.id ?? "",
              name:           i.name ?? null,
              size:           i.size ?? null,
              quantity:       i.quantity ?? null,
              purchase_price: i.purchase_price ?? null,
              status:         i.status ?? null,
              purchased_at:   i.purchased_at ?? null,
              profile_id:     i.profile_id ?? null,
              template_id_ext: i.template_id_ext ?? null,
            }))}
          photoMap={photoMap}
          profileMap={Object.fromEntries(profiles.map(p => [p.id, p.name]))}
          preselectedId={modalBundle}
          onClose={() => { setModalBundle(null); window.location.reload(); }}
        />
      )}
    </>
  );
}
