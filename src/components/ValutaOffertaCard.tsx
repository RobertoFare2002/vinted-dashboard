"use client";
// src/components/ValutaOffertaCard.tsx

import { useState, useMemo } from "react";
import { X } from "lucide-react";

type StockItem = {
  id?: string;
  name?: string | null;
  size?: string | null;
  purchase_price?: number | null;
  potentialPrice?: number | null;
  purchased_at?: string | null;
  template_id_ext?: string | null;
  status?: string | null;
};

type Props = {
  stockItems: StockItem[];
  photoMap?:  Record<string, string>;
};

const TEAL = "#007782";

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("it", { day: "numeric", month: "short", year: "numeric" });
}

function daysInStock(purchasedAt: string | null | undefined) {
  if (!purchasedAt) return null;
  return Math.floor((Date.now() - new Date(purchasedAt).getTime()) / 86400000);
}

function marginLabel(pct: number) {
  if (pct < 0)  return "Sotto costo";
  if (pct < 15) return "Minimo";
  if (pct < 30) return "Accettabile";
  return "Ottimo";
}

function marginColor(profit: number) {
  if (profit < 0) return "#FF4D4D";
  if (profit < 3) return "#f5a623";
  return "#6bb800";
}

export default function ValutaOffertaCard({ stockItems, photoMap = {} }: Props) {
  const [selId,     setSelId]     = useState("");
  const [isOpen,    setIsOpen]    = useState(false);
  const [offerVal,  setOfferVal]  = useState("");
  const [sliderVal, setSliderVal] = useState(1);

  const available = useMemo(
    () => stockItems.filter(i => i.status === "available" || i.status === "in_stock"),
    [stockItems]
  );

  const item    = available.find(i => i.id === selId) ?? null;
  const cost    = Number(item?.purchase_price ?? 0);
  const listino = Number(item?.potentialPrice ?? 0);
  const sliderMax = listino > 0 ? listino * 2 : cost > 0 ? cost * 3 : 100;
  const days    = item ? daysInStock(item.purchased_at) : null;
  const photo   = item?.template_id_ext ? (photoMap[item.template_id_ext] ?? null) : null;
  const isClearance = days !== null && days > 60;

  const offerNum  = parseFloat(offerVal) || sliderVal;
  const profit    = offerNum - cost;
  const marginPct = cost > 0 ? Math.round((profit / cost) * 100) : 0;
  const barPct    = Math.min(Math.max(marginPct, 0) / 70, 1);
  const mColor    = marginColor(profit);
  const mLabel    = marginLabel(marginPct);

  function openModal() {
    if (!item) return;
    const start = listino > 0 ? Math.round(listino * 0.7) : cost > 0 ? Math.round(cost * 1.2) : 10;
    setSliderVal(start);
    setOfferVal(String(start));
    setIsOpen(true);
  }

  function syncSlider(v: number) {
    setSliderVal(v);
    setOfferVal(String(v));
  }

  function syncInput(raw: string) {
    setOfferVal(raw);
    const n = parseFloat(raw);
    if (!isNaN(n)) setSliderVal(Math.min(Math.max(n, 1), sliderMax));
  }

  return (
    <>
      {/* ── CARD ── */}
      <div style={{
        background: "var(--white)",
        borderRadius: "0 20px 20px 0",
        borderLeft: `3px solid ${TEAL}`,
        border: "1px solid var(--border)",
        borderLeftWidth: 3,
        borderLeftColor: TEAL,
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minHeight: 160,
      }}>
        {/* Title */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Valuta offerta</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: TEAL, marginTop: 2 }}>Analisi P&amp;L</div>
        </div>

        {/* Dropdown */}
        <div style={{ position: "relative" }}>
          <select
            value={selId}
            onChange={e => setSelId(e.target.value)}
            style={{
              width: "100%", padding: "9px 32px 9px 12px", borderRadius: 10,
              border: "1px solid var(--border)", background: "var(--light)",
              color: selId ? "var(--ink)" : "var(--slate)", fontSize: 12,
              fontFamily: "inherit", outline: "none", appearance: "none",
              cursor: "pointer",
            }}
          >
            <option value="">Scegli articolo dal magazzino…</option>
            {available.map(i => (
              <option key={i.id} value={i.id}>
                {i.name}{i.size ? ` · ${i.size}` : ""}{i.purchase_price ? ` · €${fmt(Number(i.purchase_price))}` : ""}
              </option>
            ))}
          </select>
          <svg style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="var(--slate)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Preview row */}
        {item ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
            background: "var(--light)", borderRadius: 10,
          }}>
            {photo
              ? <img src={photo} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }} alt="" />
              : <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(0,119,130,.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📦</div>
            }
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
              <div style={{ fontSize: 11, color: "var(--slate)", marginTop: 2 }}>
                {cost > 0 && `€${fmt(cost)} acquisto`}{days !== null ? ` · in magazzino ${days} gg` : ""}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ height: 54, borderRadius: 10, background: "var(--light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 12, color: "var(--slate)" }}>Nessun articolo selezionato</span>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={openModal}
          disabled={!item}
          style={{
            width: "100%", padding: "10px", borderRadius: 10,
            border: `1px solid ${item ? "var(--border)" : "var(--border)"}`,
            background: "var(--white)", color: item ? "var(--ink)" : "var(--slate)",
            fontSize: 13, fontWeight: 600, fontFamily: "inherit",
            cursor: item ? "pointer" : "not-allowed", transition: "all .15s",
          }}
          onMouseEnter={e => { if (item) (e.currentTarget as HTMLButtonElement).style.borderColor = TEAL; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; }}
        >
          Analizza offerta
        </button>
      </div>

      {/* ── MODAL ── */}
      {isOpen && item && (
        <>
          <style>{`
            @keyframes voSlideUp {
              from { opacity: 0; transform: translateY(20px) scale(.97); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            .vo-modal { animation: voSlideUp .3s cubic-bezier(.22,.68,0,1.2); }
            .vo-slider {
              -webkit-appearance: none; appearance: none;
              width: 100%; height: 4px; border-radius: 2px;
              outline: none; cursor: pointer;
            }
            .vo-slider::-webkit-slider-thumb {
              -webkit-appearance: none; width: 18px; height: 18px;
              border-radius: 50%; background: ${TEAL};
              border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.2);
              cursor: pointer;
            }
            .vo-slider::-moz-range-thumb {
              width: 18px; height: 18px; border-radius: 50%;
              background: ${TEAL}; border: 2px solid #fff;
              box-shadow: 0 1px 4px rgba(0,0,0,.2); cursor: pointer;
            }
          `}</style>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.45)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={() => setIsOpen(false)}
          >
            <div
              className="vo-modal"
              onClick={e => e.stopPropagation()}
              style={{
                background: "var(--white)", borderRadius: 20,
                width: "100%", maxWidth: 440,
                maxHeight: "90vh", overflowY: "auto",
                boxShadow: "0 32px 80px rgba(0,0,0,.20)",
                display: "flex", flexDirection: "column",
              }}
            >
              {/* Header */}
              <div style={{ padding: "22px 22px 16px", borderBottom: "0.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>Valuta offerta</div>
                  <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 2 }}>Analisi P&amp;L in tempo reale</div>
                </div>
                <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--slate)", padding: 4, borderRadius: 8, lineHeight: 1 }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ padding: "16px 22px 22px", display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Product row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--light)", borderRadius: 12 }}>
                  {photo
                    ? <img src={photo} style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }} alt="" />
                    : <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(0,119,130,.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📦</div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "var(--slate)", marginTop: 2 }}>
                      {item.size ? `Taglia ${item.size}` : "Nessuna taglia"}
                    </div>
                  </div>
                  {isClearance && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#f5a623", background: "rgba(245,166,35,.12)", border: "1px solid rgba(245,166,35,.3)", padding: "3px 8px", borderRadius: 6, flexShrink: 0, whiteSpace: "nowrap" }}>Clearance</span>
                  )}
                </div>

                {/* 2×2 grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "ACQUISTATO IL",   value: item.purchased_at ? fmtDate(item.purchased_at) : "—", color: "var(--ink)" },
                    { label: "PREZZO ACQUISTO", value: cost > 0 ? `€${fmt(cost)}` : "—", color: "var(--ink)" },
                    {
                      label: "GIORNI IN STOCK",
                      value: days !== null ? `${days} gg` : "—",
                      color: days === null ? "var(--ink)" : days > 60 ? "#FF4D4D" : days > 30 ? "#f5a623" : "var(--ink)",
                    },
                    { label: "PREZZO LISTINO",  value: listino > 0 ? `€${fmt(listino)}` : "—", color: "var(--ink)" },
                  ].map(cell => (
                    <div key={cell.label} style={{ padding: "9px 12px", background: "var(--light)", borderRadius: 10 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "var(--slate)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4 }}>{cell.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: cell.color }}>{cell.value}</div>
                    </div>
                  ))}
                </div>

                {/* Offer input */}
                <div>
                  <div style={{ fontSize: 12, color: "var(--slate)", marginBottom: 8 }}>Offerta ricevuta</div>
                  <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 10, overflow: "hidden", background: "var(--white)" }}>
                    <span style={{ padding: "0 14px", fontSize: 16, fontWeight: 700, color: "var(--slate)", borderRight: "1px solid var(--border)", lineHeight: "48px", flexShrink: 0 }}>€</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={offerVal}
                      onChange={e => syncInput(e.target.value)}
                      style={{ flex: 1, border: "none", outline: "none", padding: "12px 14px", fontSize: 22, fontWeight: 700, color: "var(--ink)", textAlign: "center", background: "transparent", fontFamily: "inherit" }}
                    />
                  </div>
                </div>

                {/* Slider */}
                <div>
                  <div style={{ position: "relative", paddingBottom: 4 }}>
                    <input
                      type="range"
                      className="vo-slider"
                      min={1}
                      max={sliderMax}
                      step={0.5}
                      value={sliderVal}
                      onChange={e => syncSlider(parseFloat(e.target.value))}
                      style={{
                        background: `linear-gradient(to right, ${TEAL} 0%, ${TEAL} ${(sliderVal - 1) / (sliderMax - 1) * 100}%, var(--border) ${(sliderVal - 1) / (sliderMax - 1) * 100}%, var(--border) 100%)`,
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--slate)", marginTop: 2 }}>
                    <span>€1</span>
                    <span>€{fmt(sliderMax)}</span>
                  </div>
                </div>

                {/* Live margin */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "var(--ink)", fontWeight: 600 }}>Margine sull&apos;offerta</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: mColor }}>
                      {marginPct >= 0 ? "+" : ""}{marginPct}% · {profit >= 0 ? "+" : ""}€{fmt(profit)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${barPct * 100}%`, background: mColor, borderRadius: 3, transition: "width .15s, background .15s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                    <span style={{ fontSize: 11, color: "var(--slate)" }}>Costo €{fmt(cost)} · Offerta €{fmt(offerNum)}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: mColor }}>{mLabel}</span>
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 4 }}>
                  <button
                    onClick={() => setIsOpen(false)}
                    style={{ padding: "11px 6px", borderRadius: 10, border: "1.5px solid rgba(255,77,77,.5)", background: "transparent", color: "#FF4D4D", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,77,77,.08)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    Rifiuta
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    style={{ padding: "11px 6px", borderRadius: 10, border: `1.5px solid ${TEAL}`, background: "transparent", color: TEAL, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,119,130,.08)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    Controfferta
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    style={{ padding: "11px 6px", borderRadius: 10, border: "none", background: TEAL, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = ".85"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                  >
                    Accetta
                  </button>
                </div>

              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
