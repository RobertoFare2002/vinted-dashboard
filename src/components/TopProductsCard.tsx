"use client";
// src/components/TopProductsCard.tsx
import { useState, useMemo, useEffect, useRef } from "react";
import { Package } from "lucide-react";

const GRN = "#6bb800";
const V   = "#007782";
const INK = "#111111";
const SL  = "#888888";
const BD  = "#EBEBEB";
const W   = "#ffffff";
const LT  = "#F5F5F5";

type SaleRow = {
  id?: string;
  item_name?: string;
  buyer_seller?: string;
  amount?: number;
  cost?: number;
  status?: string;
  transaction_date?: string;
  template_id_ext?: string;
  purchased_at?: string;
  profile_id?: string | null;
  raw_data?: Record<string, unknown> | null;
};

type StockItem = {
  id?: string;
  name?: string | null;
  purchased_at?: string | null;
  template_id_ext?: string | null;
};

type Props = {
  sales:    SaleRow[];
  photoMap: Record<string, string>;
  stockItems: StockItem[];
  selectedProfileId?: string | null;
};

type ViewKey = "assoluto" | "percentuale" | "velocita";

interface RankedItem {
  name:    string;
  photoUrl: string | null;
  buy:     number;
  sell:    number;
  value:   number;
  display: string;
  color:   string;
}

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildRanking(sales: SaleRow[], photoMap: Record<string, string>, stockItems: StockItem[], view: ViewKey): RankedItem[] {
  const closed = sales.filter(s => {
    const name = s.item_name || s.buyer_seller || "";
    const cost = Number(s.cost ?? 0);
    return (
      (s.status === "closed" || s.status === "open") &&
      s.amount &&
      cost > 1 &&
      name.trim() !== "" &&
      !/^bundle/i.test(name.trim())
    );
  });

  const purchasedMap: Record<string, string> = {};
  for (const si of stockItems) {
    if (si.template_id_ext && si.purchased_at) {
      purchasedMap[si.template_id_ext] = si.purchased_at;
    }
  }

  if (view === "assoluto") {
    return closed
      .map(s => {
        const buy  = Number(s.cost ?? 0);
        const sell = Number(s.amount ?? 0);
        const abs  = sell - buy;
        return { name: (s.item_name || s.buyer_seller || "Articolo"), photoUrl: s.template_id_ext ? (photoMap[s.template_id_ext] ?? null) : null, buy, sell, value: abs, display: `+€${fmt(abs)}`, color: GRN };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }

  if (view === "percentuale") {
    return closed
      .filter(s => Number(s.cost ?? 0) > 0)
      .map(s => {
        const buy  = Number(s.cost ?? 0);
        const sell = Number(s.amount ?? 0);
        const pct  = Math.round(((sell - buy) / buy) * 100);
        return { name: (s.item_name || s.buyer_seller || "Articolo"), photoUrl: s.template_id_ext ? (photoMap[s.template_id_ext] ?? null) : null, buy, sell, value: pct, display: `+${pct}%`, color: GRN };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }

  const purchasedByStockId: Record<string, string> = {};
  const purchasedByName: Record<string, string> = {};
  for (const si of stockItems) {
    if (si.id && si.purchased_at) purchasedByStockId[si.id] = si.purchased_at;
    if (si.name && si.purchased_at) {
      const key = si.name.toLowerCase().trim();
      if (!purchasedByName[key] || si.purchased_at < purchasedByName[key]) purchasedByName[key] = si.purchased_at;
    }
  }

  function parseRaw(raw: unknown): Record<string, unknown> {
    if (!raw) return {};
    if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return {}; } }
    if (typeof raw === "object") return raw as Record<string, unknown>;
    return {};
  }

  return closed
    .filter(s => !!s.transaction_date)
    .map(s => {
      const rd = parseRaw(s.raw_data);
      const stockId = rd.stock_id as string | undefined;
      const saleName = (s.item_name || s.buyer_seller || "").toLowerCase().trim();
      const purchasedAt =
        (s.template_id_ext && purchasedMap[s.template_id_ext]) ||
        (stockId && purchasedByStockId[stockId]) ||
        (saleName && purchasedByName[saleName]) ||
        null;
      const buy  = Number(s.cost ?? 0);
      const sell = Number(s.amount ?? 0);
      if (!purchasedAt) return null;
      const days = Math.max(0, Math.floor((new Date(s.transaction_date!).getTime() - new Date(purchasedAt).getTime()) / 86400000));
      return { name: (s.item_name || s.buyer_seller || "Articolo"), photoUrl: s.template_id_ext ? (photoMap[s.template_id_ext] ?? null) : null, buy, sell, value: days, display: days === 0 ? "< 1g" : `${days}g`, color: V };
    })
    .filter((x): x is RankedItem => x !== null)
    .sort((a, b) => a.value - b.value)
    .filter((item, _idx, arr) => arr.findIndex(x => x.name === item.name) === _idx)
    .slice(0, 3);
}

const VIEWS: { key: ViewKey; icon: string; title: string; heroBg: string; heroBorder: string }[] = [
  { key: "assoluto",    icon: "◆", title: "Top margine assoluto",    heroBg: "rgba(107,184,0,0.06)",  heroBorder: "rgba(107,184,0,0.2)"  },
  { key: "percentuale", icon: "▲", title: "Top margine %",           heroBg: "rgba(107,184,0,0.06)",  heroBorder: "rgba(107,184,0,0.2)"  },
  { key: "velocita",    icon: "⚡", title: "Venduti più velocemente", heroBg: "rgba(0,119,130,0.06)", heroBorder: "rgba(0,119,130,0.2)" },
];

const MEDALS = ["🏆", "🥈", "🥉"];

function Photo({ url, size }: { url: string | null; size: number }) {
  if (url) return <img src={url} alt="" style={{ width: size, height: size, borderRadius: size * 0.22, objectFit: "cover", flexShrink: 0, border: `0.5px solid ${BD}` }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: LT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `0.5px solid ${BD}` }}>
      <Package size={size * 0.35} color={SL} />
    </div>
  );
}

export default function TopProductsCard({ sales, photoMap, stockItems, selectedProfileId }: Props) {
  const [view, setView] = useState<ViewKey>("assoluto");
  const v = VIEWS.find(x => x.key === view)!;

  useEffect(() => {
    const timer = setInterval(() => {
      setView(current => {
        const idx = VIEWS.findIndex(x => x.key === current);
        return VIEWS[(idx + 1) % VIEWS.length].key;
      });
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const filteredSales = useMemo(() => {
    if (!selectedProfileId) return sales;
    return sales.filter(s => s.profile_id === selectedProfileId);
  }, [sales, selectedProfileId]);

  const items = useMemo(
    () => buildRanking(filteredSales, photoMap, stockItems, view),
    [filteredSales, photoMap, stockItems, view]
  );

  const [hero, r2, r3] = items;

  if (!hero) return (
    <div style={{ background: W, borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", padding: "22px 22px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 120, gap: 8 }}>
      <div style={{ fontSize: 13, color: SL, textAlign: "center" }}>Nessun dato disponibile per la classifica</div>
    </div>
  );

  return (
    <>
      <style>{`
        .tpc-root {
          background:${W}; border-radius:20px;
          box-shadow:0 4px 20px rgba(0,0,0,0.06);
          padding:18px 18px 14px;
          container-type: inline-size;
          container-name: tpc;
        }
        .tpc-slide-in { animation: tpcSlideIn 0.4s cubic-bezier(.22,.68,0,1.2) both; }
        @keyframes tpcSlideIn { from { opacity:0; transform:translateX(-22px); } to { opacity:1; transform:translateX(0); } }
        .tpc-title { font-size:13px; font-weight:700; color:${INK}; margin-bottom:12px; display:flex; align-items:center; gap:6px; }
        .tpc-hero { border-radius:12px; padding:10px; margin-bottom:8px; border:0.5px solid transparent; }
        .tpc-hero-row { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; }
        .tpc-hero-left { display:flex; gap:8px; align-items:flex-start; min-width:0; flex:1; }
        .tpc-hero-info { min-width:0; flex:1; overflow:hidden; }
        .tpc-medal { font-size:10px; font-weight:700; margin-bottom:3px; }
        .tpc-hero-name { font-size:13px; font-weight:700; color:${INK}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .tpc-hero-sub { font-size:10px; color:${SL}; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .tpc-hero-value { font-size:18px; font-weight:800; flex-shrink:0; letter-spacing:-.03em; }
        .tpc-r23 { }
        .tpc-row { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:7px 0; }
        .tpc-row-left { display:flex; align-items:center; gap:8px; min-width:0; flex:1; overflow:hidden; }
        .tpc-row-info { min-width:0; flex:1; overflow:hidden; }
        .tpc-row-medal-name { display:flex; align-items:center; gap:4px; margin-bottom:2px; overflow:hidden; }
        .tpc-row-name { font-size:12px; font-weight:600; color:${INK}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; flex:1; }
        .tpc-row-sub { font-size:10px; color:${SL}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .tpc-row-value { font-size:12px; font-weight:700; flex-shrink:0; }
        .tpc-divider { height:0.5px; background:${BD}; }
        .tpc-dots { display:flex; justify-content:center; align-items:center; gap:9px; margin-top:12px; }
        .tpc-dot { border-radius:50%; cursor:pointer; border:none; padding:0; transition:all .18s ease; }

        /* Nascondi #2 e #3 quando il container è stretto (sotto ~200px di content-box) */
        @container tpc (max-width: 200px) {
          .tpc-r23 { display: none; }
        }
      `}</style>

      <div className="tpc-root">
        <div className="tpc-title">
          <span style={{ color: v.key === "velocita" ? V : GRN }}>{v.icon}</span>
          {v.title}
        </div>

        <div key={view} className="tpc-slide-in">
          {/* Hero #1 */}
          <div className="tpc-hero" style={{ background: v.heroBg, borderColor: v.heroBorder }}>
            <div className="tpc-hero-row">
              <div className="tpc-hero-left">
                <Photo url={hero.photoUrl} size={44} />
                <div className="tpc-hero-info">
                  <div className="tpc-medal" style={{ color: hero.color }}>{MEDALS[0]} #1</div>
                  <div className="tpc-hero-name">{hero.name}</div>
                  <div className="tpc-hero-sub">€{fmt(hero.buy)} → €{fmt(hero.sell)}</div>
                </div>
              </div>
              <div className="tpc-hero-value" style={{ color: hero.color }}>{hero.display}</div>
            </div>
          </div>

          {/* #2 e #3 — nascosti via container query quando troppo stretto */}
          <div className="tpc-r23">
            {r2 && (
              <>
                <div className="tpc-row">
                  <div className="tpc-row-left">
                    <Photo url={r2.photoUrl} size={34} />
                    <div className="tpc-row-info">
                      <div className="tpc-row-medal-name">
                        <span style={{ fontSize: 12 }}>{MEDALS[1]}</span>
                        <span className="tpc-row-name">{r2.name}</span>
                      </div>
                    </div>
                  </div>
                  <span className="tpc-row-value" style={{ color: r2.color }}>{r2.display}</span>
                </div>
                <div className="tpc-divider" />
              </>
            )}
            {r3 && (
              <div className="tpc-row">
                <div className="tpc-row-left">
                  <Photo url={r3.photoUrl} size={34} />
                  <div className="tpc-row-info">
                    <div className="tpc-row-medal-name">
                      <span style={{ fontSize: 12 }}>{MEDALS[2]}</span>
                      <span className="tpc-row-name">{r3.name}</span>
                    </div>
                  </div>
                </div>
                <span className="tpc-row-value" style={{ color: r3.color }}>{r3.display}</span>
              </div>
            )}
          </div>
        </div>

        <div className="tpc-dots">
          {VIEWS.map(({ key }) => (
            <button key={key} className="tpc-dot" onClick={() => setView(key)}
              style={{ width: view === key ? "10px" : "7px", height: view === key ? "10px" : "7px", background: view === key ? INK : "rgba(0,0,0,0.18)" }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
