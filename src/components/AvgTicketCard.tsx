"use client";
// src/components/AvgTicketCard.tsx
import { useState, useEffect } from "react";

const G   = "#007782";
const GBG = "#f0fad0";
const INK = "#111111";
const SL  = "#888888";
const BD  = "#EBEBEB";
const W   = "#ffffff";
const AMB = "#F5A623";

type SaleRow = {
  amount?: number | null;
  cost?:   number | null;
  status?: string | null;
  profile_id?: string | null;
  raw_data?: unknown;
};

type Props = {
  sales: SaleRow[];
  selectedProfileId?: string | null;
  defaultView?: View;
};

type View = "vendita" | "acquisto";

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Expand a sale into individual { amount, cost } entries.
// For bundles, returns one entry per item using individual sale_price and cost.
// For regular sales, returns a single entry.
function expandSale(s: SaleRow): { amount: number; cost: number }[] {
  try {
    const rd = typeof s.raw_data === "string" ? JSON.parse(s.raw_data) : s.raw_data;
    if (rd && rd.bulk === true && Array.isArray(rd.items) && rd.items.length > 0) {
      return rd.items.map((item: { sale_price?: number; cost?: number }) => ({
        amount: Number(item.sale_price ?? 0),
        cost:   Number(item.cost ?? 0),
      }));
    }
  } catch {}
  return [{ amount: Number(s.amount ?? 0), cost: Number(s.cost ?? 0) }];
}

export default function AvgTicketCard({ sales, selectedProfileId, defaultView = "vendita" }: Props) {
  const [view, setView] = useState<View>(defaultView);
  const [animKey, setAnimKey] = useState(0);

  // Filter by profile if selected
  const filtered = selectedProfileId
    ? sales.filter(s => s.profile_id === selectedProfileId)
    : sales;

  const closed = filtered.filter(s => s.status === "closed" || s.status === "open");

  // Expand all sales (including bundles) into individual items, exclude cost <= 1
  const expanded = closed.flatMap(s => expandSale(s)).filter(e => e.cost > 1);

  // Vendita stats
  const amounts = expanded.map(e => e.amount).filter(v => v > 0);
  const avgSell = amounts.length ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
  const minSell = amounts.length ? Math.min(...amounts) : 0;
  const maxSell = amounts.length ? Math.max(...amounts) : 0;

  // Acquisto stats
  const costs = expanded.map(e => e.cost).filter(v => v > 1);
  const avgBuy = costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
  const minBuy = costs.length ? Math.min(...costs) : 0;
  const maxBuy = costs.length ? Math.max(...costs) : 0;

  const isVendita = view === "vendita";
  const avg = isVendita ? avgSell : avgBuy;
  const min = isVendita ? minSell : minBuy;
  const max = isVendita ? maxSell : maxBuy;
  const pct = max > 0 ? Math.round(((avg - min) / (max - min)) * 100) : 50;

  function switchView(v: View) {
    if (v === view) return;
    setView(v);
    setAnimKey(k => k + 1);
  }

  return (
    <>
      <style>{`
        .atc-root {
          background: ${W};
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          padding: 18px 20px 14px;
          display: flex; flex-direction: column;
        }
        .atc-content-wrap {
          flex: 1; overflow: hidden; min-height: 90px;
        }
        .atc-slide { animation: atcSlide 0.4s cubic-bezier(.22,.68,0,1.2) both; }
        @keyframes atcSlide {
          from { opacity: 0; transform: translateX(-18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .atc-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
        .atc-label { font-size:11px; font-weight:600; color:${SL}; text-transform:uppercase; letter-spacing:.06em; }
        .atc-badge { font-size:10px; font-weight:600; padding:3px 9px; border-radius:999px; }
        .atc-badge-g { background:${GBG}; color:#3B6D11; }
        .atc-badge-a { background:#fef3c7; color:#854F0B; }
        .atc-value { font-size:26px; font-weight:800; color:${INK}; letter-spacing:-.04em; line-height:1.1; margin-bottom:3px; }
        .atc-sub { font-size:12px; color:${SL}; margin-bottom:10px; }
        .atc-track { height:5px; background:#F0F0F0; border-radius:999px; overflow:hidden; margin-bottom:5px; }
        .atc-fill-g { height:100%; border-radius:999px; background:${G}; transition:width .4s ease; }
        .atc-fill-a { height:100%; border-radius:999px; background:${AMB}; transition:width .4s ease; }
        .atc-minmax { display:flex; justify-content:space-between; font-size:11px; color:${SL}; margin-bottom:10px; }
        .atc-dots { display:flex; justify-content:center; gap:7px; }
        .atc-dot { border-radius:50%; border:none; padding:0; cursor:pointer; transition:all .18s; }
      `}</style>

      <div className="atc-root">
        <div className="atc-header">
          <span className="atc-label">Ticket medio {isVendita ? "vendita" : "acquisto"}</span>
          <span className={`atc-badge ${isVendita ? "atc-badge-g" : "atc-badge-a"}`}>
            {isVendita ? "vendite" : "acquisti"}
          </span>
        </div>

        <div className="atc-content-wrap">
          <div key={animKey} className="atc-slide">
            <div className="atc-value">
              {avg > 0 ? `€${fmt(avg)}` : "—"}
            </div>
            <div className="atc-sub">
              media per articolo {isVendita ? "venduto" : "acquistato"}
            </div>

            <div className="atc-track">
              <div
                className={isVendita ? "atc-fill-g" : "atc-fill-a"}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="atc-minmax">
              <span>min {min > 0 ? `€${fmt(min)}` : "—"}</span>
              <span>max {max > 0 ? `€${fmt(max)}` : "—"}</span>
            </div>
          </div>
        </div>

        <div className="atc-dots">
          {(["vendita", "acquisto"] as View[]).map(v => (
            <button
              key={v}
              className="atc-dot"
              onClick={() => switchView(v)}
              style={{
                width:      view === v ? "10px" : "7px",
                height:     view === v ? "10px" : "7px",
                background: view === v ? INK : "rgba(0,0,0,0.18)",
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
