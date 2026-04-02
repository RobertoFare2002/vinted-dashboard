"use client";
// src/components/TopProductsCard.tsx
import { useState, useMemo } from "react";
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
  amount?: number;
  cost?: number;
  status?: string;
  transaction_date?: string;
  template_id_ext?: string;
  purchased_at?: string;
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
};

type ViewKey = "assoluto" | "percentuale" | "velocita";

interface RankedItem {
  name:    string;
  photoUrl: string | null;
  buy:     number;
  sell:    number;
  value:   number;   // margine abs, % o giorni
  display: string;   // stringa formattata
  color:   string;
}

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildRanking(sales: SaleRow[], photoMap: Record<string, string>, stockItems: StockItem[], view: ViewKey): RankedItem[] {
  // Includi sia vendite chiuse che in sospeso, escludi bundle interi
  // Non filtrare su s.cost qui — alcune righe possono avere cost=null e vanno comunque mostrate
  const closed = sales.filter(s =>
    (s.status === "closed" || s.status === "open") &&
    s.amount &&
    s.item_name &&
    !/^bundle/i.test(s.item_name.trim())
  );

  // Map template_id_ext → purchased_at from stockItems for velocity
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
        return {
          name:     s.item_name!,
          photoUrl: s.template_id_ext ? (photoMap[s.template_id_ext] ?? null) : null,
          buy, sell,
          value:   abs,
          display: `+€${fmt(abs)}`,
          color:   GRN,
        };
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
        return {
          name:     s.item_name!,
          photoUrl: s.template_id_ext ? (photoMap[s.template_id_ext] ?? null) : null,
          buy, sell,
          value:   pct,
          display: `+${pct}%`,
          color:   GRN,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }

  // velocita: giorni tra purchased_at e transaction_date
  return closed
    .filter(s => s.transaction_date && s.template_id_ext && purchasedMap[s.template_id_ext!])
    .map(s => {
      const bought = new Date(purchasedMap[s.template_id_ext!]);
      const sold   = new Date(s.transaction_date!);
      const days   = Math.max(0, Math.floor((sold.getTime() - bought.getTime()) / 86400000));
      const buy    = Number(s.cost ?? 0);
      const sell   = Number(s.amount ?? 0);
      return {
        name:     s.item_name!,
        photoUrl: s.template_id_ext ? (photoMap[s.template_id_ext] ?? null) : null,
        buy, sell,
        value:   days,
        display: days === 0 ? "< 1g" : `${days}g`,
        color:   V,
      };
    })
    .sort((a, b) => a.value - b.value)
    .slice(0, 3);
}

const VIEWS: { key: ViewKey; icon: string; title: string; heroBg: string; heroBorder: string }[] = [
  { key: "assoluto",    icon: "◆", title: "Top margine assoluto",      heroBg: "rgba(107,184,0,0.06)",  heroBorder: "rgba(107,184,0,0.2)"  },
  { key: "percentuale", icon: "▲", title: "Top margine %",             heroBg: "rgba(107,184,0,0.06)",  heroBorder: "rgba(107,184,0,0.2)"  },
  { key: "velocita",    icon: "⚡", title: "Venduti più velocemente",   heroBg: "rgba(0,119,130,0.06)", heroBorder: "rgba(0,119,130,0.2)" },
];

const MEDALS = ["🏆", "🥈", "🥉"];

function Photo({ url, size }: { url: string | null; size: number }) {
  if (url) {
    return (
      <img src={url} alt=""
        style={{ width: size, height: size, borderRadius: size * 0.22, objectFit: "cover",
          flexShrink: 0, border: `0.5px solid ${BD}` }} />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: LT,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `0.5px solid ${BD}` }}>
      <Package size={size * 0.35} color={SL} />
    </div>
  );
}

export default function TopProductsCard({ sales, photoMap, stockItems }: Props) {
  const [view, setView] = useState<ViewKey>("assoluto");
  const v = VIEWS.find(x => x.key === view)!;

  const items = useMemo(
    () => buildRanking(sales, photoMap, stockItems, view),
    [sales, photoMap, stockItems, view]
  );

  const [hero, r2, r3] = items;

  if (!hero) return (
    <div className="tpc-root" style={{ background: W, borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", padding: "22px 22px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 120, gap: 8 }}>
      <div style={{ fontSize: 13, color: SL, textAlign: "center" }}>Nessun dato disponibile per la classifica</div>
    </div>
  );

  return (
    <>
      <style>{`
        .tpc-root { background:${W}; border-radius:20px; box-shadow:0 4px 20px rgba(0,0,0,0.06); padding:22px 22px 16px; }
        .tpc-title { font-size:13px; font-weight:700; color:${INK}; margin-bottom:12px; display:flex; align-items:center; gap:6px; }
        .tpc-hero { border-radius:12px; padding:12px; margin-bottom:10px; border:0.5px solid transparent; }
        .tpc-hero-row { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
        .tpc-hero-left { display:flex; gap:10px; align-items:flex-start; min-width:0; }
        .tpc-hero-info { min-width:0; }
        .tpc-medal { font-size:10px; font-weight:700; margin-bottom:4px; }
        .tpc-hero-name { font-size:14px; font-weight:700; color:${INK}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .tpc-hero-sub { font-size:11px; color:${SL}; margin-top:2px; }
        .tpc-hero-value { font-size:22px; font-weight:800; flex-shrink:0; letter-spacing:-.03em; }
        .tpc-row { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:9px 0; }
        .tpc-row-left { display:flex; align-items:center; gap:10px; min-width:0; }
        .tpc-row-info { min-width:0; }
        .tpc-row-medal-name { display:flex; align-items:center; gap:5px; margin-bottom:2px; }
        .tpc-row-name { font-size:12px; font-weight:600; color:${INK}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .tpc-row-sub { font-size:11px; color:${SL}; }
        .tpc-row-value { font-size:13px; font-weight:700; flex-shrink:0; }
        .tpc-divider { height:0.5px; background:${BD}; }
        .tpc-dots { display:flex; justify-content:center; align-items:center; gap:9px; margin-top:14px; }
        .tpc-dot { border-radius:50%; cursor:pointer; border:none; padding:0; transition:all .18s ease; }
      `}</style>

      <div className="tpc-root">
        {/* Title */}
        <div className="tpc-title">
          <span style={{ color: v.key === "velocita" ? V : GRN }}>{v.icon}</span>
          {v.title}
        </div>

        {/* Hero #1 */}
        <div className="tpc-hero" style={{ background: v.heroBg, borderColor: v.heroBorder }}>
          <div className="tpc-hero-row">
            <div className="tpc-hero-left">
              <Photo url={hero.photoUrl} size={48} />
              <div className="tpc-hero-info">
                <div className="tpc-medal" style={{ color: hero.color }}>{MEDALS[0]} #1</div>
                <div className="tpc-hero-name">{hero.name}</div>
                <div className="tpc-hero-sub">acquistato €{fmt(hero.buy)} · venduto €{fmt(hero.sell)}</div>
              </div>
            </div>
            <div className="tpc-hero-value" style={{ color: hero.color }}>{hero.display}</div>
          </div>
        </div>

        {/* #2 */}
        {r2 && (
          <>
            <div className="tpc-row">
              <div className="tpc-row-left">
                <Photo url={r2.photoUrl} size={36} />
                <div className="tpc-row-info">
                  <div className="tpc-row-medal-name">
                    <span style={{ fontSize: 13 }}>{MEDALS[1]}</span>
                    <span className="tpc-row-name">{r2.name}</span>
                  </div>
                  <div className="tpc-row-sub">acquistato €{fmt(r2.buy)} · venduto €{fmt(r2.sell)}</div>
                </div>
              </div>
              <span className="tpc-row-value" style={{ color: r2.color }}>{r2.display}</span>
            </div>
            <div className="tpc-divider" />
          </>
        )}

        {/* #3 */}
        {r3 && (
          <div className="tpc-row">
            <div className="tpc-row-left">
              <Photo url={r3.photoUrl} size={36} />
              <div className="tpc-row-info">
                <div className="tpc-row-medal-name">
                  <span style={{ fontSize: 13 }}>{MEDALS[2]}</span>
                  <span className="tpc-row-name">{r3.name}</span>
                </div>
                <div className="tpc-row-sub">acquistato €{fmt(r3.buy)} · venduto €{fmt(r3.sell)}</div>
              </div>
            </div>
            <span className="tpc-row-value" style={{ color: r3.color }}>{r3.display}</span>
          </div>
        )}

        {/* Dots */}
        <div className="tpc-dots">
          {VIEWS.map(({ key }) => (
            <button key={key} className="tpc-dot" onClick={() => setView(key)}
              style={{
                width:      view === key ? "10px" : "7px",
                height:     view === key ? "10px" : "7px",
                background: view === key ? INK : "rgba(0,0,0,0.18)",
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
