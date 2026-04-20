"use client";
// src/components/ValutaOffertaCard.tsx

import { useState, useMemo, useRef, useEffect } from "react";
import { X, Search } from "lucide-react";

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
  if (pct < 0)   return "Sotto costo";
  if (pct < 50)  return "Accettabile";
  if (pct < 100) return "Buono";
  if (pct < 200) return "Ottimo";
  return "Hai spaccato";
}

function marginColor(pct: number) {
  if (pct < 0)   return "#FF4D4D";
  if (pct < 50)  return "#f5a623";
  return "#6bb800";
}

export default function ValutaOffertaCard({ stockItems, photoMap = {} }: Props) {
  const [query,        setQuery]        = useState("");
  const [showDrop,     setShowDrop]     = useState(false);
  const [selId,        setSelId]        = useState("");
  const [isOpen,       setIsOpen]       = useState(false);
  const [offerVal,     setOfferVal]     = useState("");
  const [sliderVal,    setSliderVal]    = useState(1);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const available = useMemo(
    () => stockItems.filter(i => i.status === "available" || i.status === "in_stock"),
    [stockItems]
  );

  const results = useMemo(() => {
    if (!query.trim()) return available.slice(0, 6);
    const q = query.toLowerCase();
    return available.filter(i => (i.name ?? "").toLowerCase().includes(q)).slice(0, 8);
  }, [available, query]);

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
  const mColor    = marginColor(marginPct);
  const mLabel    = marginLabel(marginPct);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowDrop(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset focused index when results change
  useEffect(() => { setFocusedIndex(-1); }, [results]);

  function selectItem(id: string, name: string) {
    setSelId(id);
    setQuery(name);
    setShowDrop(false);
    setFocusedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDrop || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = focusedIndex >= 0 ? results[focusedIndex] : results[0];
      if (target) selectItem(target.id ?? "", target.name ?? "");
    } else if (e.key === "Escape") {
      setShowDrop(false);
    }
  }

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
      <style>{`
        .vo-search-wrap {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 12px; border: 1px solid var(--border);
          border-radius: 12px; background: var(--light);
          transition: border-color .15s;
        }
        .vo-search-wrap:focus-within { border-color: ${TEAL}; }
        .vo-search-wrap input {
          border: none; outline: none; font-size: 13px;
          font-family: inherit; color: var(--ink); background: transparent; width: 100%;
        }
        .vo-search-wrap input::placeholder { color: #b0b0b0; }
        .vo-result-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; cursor: pointer; border-bottom: 0.5px solid var(--border); transition: background .1s; }
        .vo-result-item:last-child { border-bottom: none; }
        .vo-result-item:hover, .vo-result-item.focused { background: var(--light); }
        .vo-result-item.selected { background: rgba(0,119,130,.06); }
      `}</style>

      {/* ── CARD ── */}
      <div style={{
        background: "var(--white)",
        borderRadius: 20,
        border: "1px solid var(--border)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}>
        {/* Title */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Valuta offerta</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: TEAL, marginTop: 1 }}>Analisi P&amp;L</div>
        </div>

        {/* Search bar */}
        <div ref={wrapRef} style={{ position: "relative" }}>
          <div className="vo-search-wrap">
            <Search size={13} color="#b0b0b0" style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setShowDrop(true); if (!e.target.value) setSelId(""); }}
              onFocus={() => setShowDrop(true)}
              onKeyDown={handleKeyDown}
              placeholder="Cerca articolo dal magazzino…"
            />
            {query && (
              <button onClick={() => { setQuery(""); setSelId(""); setShowDrop(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#b0b0b0", padding: 0, lineHeight: 1 }}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Results dropdown */}
          {showDrop && results.length > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
              background: "var(--white)", borderRadius: 12,
              border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,.10)",
              overflow: "hidden", maxHeight: 220, overflowY: "auto",
            }}>
              {results.map((i, idx) => {
                const p = i.template_id_ext ? (photoMap[i.template_id_ext] ?? null) : null;
                const d = daysInStock(i.purchased_at);
                const isFocused = idx === focusedIndex;
                const isSelected = selId === i.id;
                return (
                  <div
                    key={i.id}
                    className={`vo-result-item${isFocused ? " focused" : ""}${isSelected ? " selected" : ""}`}
                    onMouseDown={() => selectItem(i.id ?? "", i.name ?? "")}
                    onMouseEnter={() => setFocusedIndex(idx)}
                  >
                    {p
                      ? <img src={p} style={{ width: 32, height: 32, borderRadius: 7, objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }} alt="" />
                      : <div style={{ width: 32, height: 32, borderRadius: 7, background: "rgba(0,119,130,.1)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📦</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.name}</div>
                      <div style={{ fontSize: 10, color: "var(--slate)", marginTop: 1 }}>
                        {i.purchase_price ? `€${fmt(Number(i.purchase_price))}` : ""}
                        {i.size ? ` · ${i.size}` : ""}
                        {d !== null ? ` · ${d} gg` : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview row */}
        {item && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
            background: "var(--light)", borderRadius: 10,
          }}>
            {photo
              ? <img src={photo} style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }} alt="" />
              : <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,119,130,.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>📦</div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
              <div style={{ fontSize: 10, color: "var(--slate)", marginTop: 1 }}>
                {cost > 0 ? `€${fmt(cost)} acquisto` : ""}
                {days !== null ? ` · in magazzino ${days} gg` : ""}
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={openModal}
          disabled={!item}
          style={{
            width: "100%", padding: "9px", borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--white)", color: item ? "var(--ink)" : "var(--slate)",
            fontSize: 13, fontWeight: 600, fontFamily: "inherit",
            cursor: item ? "pointer" : "not-allowed", transition: "border-color .15s",
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
              border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.2); cursor: pointer;
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
              }}
            >
              {/* Header */}
              <div style={{ padding: "22px 22px 16px", borderBottom: "0.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>Valuta offerta</div>
                  <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 2 }}>Analisi P&amp;L in tempo reale</div>
                </div>
                <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--slate)", padding: 4, borderRadius: 8 }}>
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
                    { label: "PREZZO LISTINO", value: listino > 0 ? `€${fmt(listino)}` : "—", color: "var(--ink)" },
                  ].map(cell => (
                    <div key={cell.label} style={{ padding: "9px 12px", background: "var(--light)", borderRadius: 10 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "var(--slate)", letterSpacing: ".06em", textTransform: "uppercase" as const, marginBottom: 4 }}>{cell.label}</div>
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
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--slate)", marginTop: 2 }}>
                    <span>€1</span><span>€{fmt(sliderMax)}</span>
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
                  <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${barPct * 100}%`, background: mColor, borderRadius: 3, transition: "width .15s, background .15s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                    <span style={{ fontSize: 11, color: "var(--slate)" }}>Costo €{fmt(cost)} · Offerta €{fmt(offerNum)}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: mColor }}>{mLabel}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
