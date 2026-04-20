"use client";
// src/components/OfferCalculatorCard.tsx — 3 mockup selezionabili

import { useState, useMemo } from "react";

type StockItem = {
  id?: string;
  name?: string | null;
  purchase_price?: number | null;
  size?: string | null;
  template_id_ext?: string | null;
  status?: string | null;
};

type Props = {
  stockItems: StockItem[];
  photoMap?:  Record<string, string>;
};

const VINTED_FEE = 0.05; // 5% stima commissione

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function verdict(margin: number) {
  if (margin >= 30) return { label: "Accetta",    color: "#6bb800", bg: "rgba(107,184,0,.12)",  border: "rgba(107,184,0,.3)",  icon: "✓" };
  if (margin >= 10) return { label: "Controferta", color: "#f5a623", bg: "rgba(245,166,35,.12)", border: "rgba(245,166,35,.3)", icon: "~" };
  return               { label: "Rifiuta",    color: "#FF4D4D", bg: "rgba(255,77,77,.12)",  border: "rgba(255,77,77,.3)",  icon: "✕" };
}

function counterOffer(cost: number, targetMargin = 30) {
  return cost * (1 + targetMargin / 100) / (1 - VINTED_FEE);
}

// ─────────────────────────────────────────────────────────────────
// MOCKUP A — Quick Check (compatto, verdict immediato)
// ─────────────────────────────────────────────────────────────────
function MockupA({ items, photoMap }: { items: StockItem[]; photoMap: Record<string, string> }) {
  const [selId, setSelId]     = useState("");
  const [offer, setOffer]     = useState("");

  const item    = items.find(i => i.id === selId);
  const cost    = Number(item?.purchase_price ?? 0);
  const offerN  = parseFloat(offer) || 0;
  const net     = offerN * (1 - VINTED_FEE);
  const profit  = net - cost;
  const margin  = cost > 0 ? Math.round((profit / cost) * 100) : 0;
  const v       = item && offerN > 0 ? verdict(margin) : null;
  const photo   = item?.template_id_ext ? photoMap[item.template_id_ext] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
      {/* Item selector */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {photo
          ? <img src={photo} style={{ width: 38, height: 38, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }} alt="" />
          : <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--light)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📦</div>
        }
        <select
          value={selId}
          onChange={e => setSelId(e.target.value)}
          style={{ flex: 1, padding: "7px 10px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--light)", color: "var(--ink)", fontSize: 12, fontFamily: "inherit", outline: "none" }}
        >
          <option value="">Scegli articolo…</option>
          {items.map(i => (
            <option key={i.id} value={i.id}>{i.name}{i.size ? ` · ${i.size}` : ""}</option>
          ))}
        </select>
      </div>

      {item && (
        <div style={{ fontSize: 11, color: "var(--slate)", display: "flex", gap: 10 }}>
          <span>Costo: <b style={{ color: "var(--ink)" }}>€{fmt(cost)}</b></span>
          <span>Min. 30%: <b style={{ color: "#007782" }}>€{fmt(counterOffer(cost))}</b></span>
        </div>
      )}

      {/* Offer input */}
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 700, color: "var(--slate)" }}>€</span>
        <input
          type="number"
          step="0.5"
          min="0"
          value={offer}
          onChange={e => setOffer(e.target.value)}
          placeholder="Offerta ricevuta"
          disabled={!item}
          style={{ width: "100%", padding: "9px 12px 9px 26px", borderRadius: 10, border: "1px solid var(--border)", background: item ? "var(--white)" : "var(--light)", color: "var(--ink)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Verdict */}
      {v ? (
        <div style={{ borderRadius: 12, padding: "10px 14px", background: v.bg, border: `1px solid ${v.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flex: 1 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: v.color, letterSpacing: "-.02em" }}>{v.icon} {v.label}</div>
            <div style={{ fontSize: 11, color: v.color, marginTop: 2 }}>
              {profit >= 0 ? "+" : ""}€{fmt(profit)} · {margin >= 0 ? "+" : ""}{margin}% margine
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: "var(--slate)" }}>
            netto<br />
            <b style={{ fontSize: 14, color: "var(--ink)" }}>€{fmt(net)}</b>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, borderRadius: 12, background: "var(--light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 12, color: "var(--slate)" }}>{item ? "Inserisci l'offerta" : "Seleziona un articolo"}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MOCKUP B — P&L Breakdown (analisi dettagliata riga per riga)
// ─────────────────────────────────────────────────────────────────
function MockupB({ items, photoMap }: { items: StockItem[]; photoMap: Record<string, string> }) {
  const [selId, setSelId]   = useState("");
  const [offer, setOffer]   = useState("");

  const item   = items.find(i => i.id === selId);
  const cost   = Number(item?.purchase_price ?? 0);
  const offerN = parseFloat(offer) || 0;
  const fee    = Math.round(offerN * VINTED_FEE * 100) / 100;
  const net    = offerN - fee;
  const profit = net - cost;
  const margin = cost > 0 ? Math.round((profit / cost) * 100) : 0;
  const v      = item && offerN > 0 ? verdict(margin) : null;
  const ctr    = cost > 0 ? counterOffer(cost) : 0;

  const rows = item && offerN > 0 ? [
    { label: "Offerta ricevuta",    value: `€${fmt(offerN)}`,  color: "var(--ink)" },
    { label: "Commissione Vinted (~5%)", value: `−€${fmt(fee)}`, color: "#FF4D4D" },
    { label: "Ricavo netto",        value: `€${fmt(net)}`,    color: "#007782" },
    { label: "Costo acquisto",      value: `−€${fmt(cost)}`,  color: "#FF4D4D" },
  ] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
      {/* Selector row */}
      <div style={{ display: "flex", gap: 8 }}>
        <select
          value={selId}
          onChange={e => setSelId(e.target.value)}
          style={{ flex: 1, padding: "7px 10px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--light)", color: "var(--ink)", fontSize: 12, fontFamily: "inherit", outline: "none" }}
        >
          <option value="">Scegli articolo dal magazzino…</option>
          {items.map(i => (
            <option key={i.id} value={i.id}>{i.name}{i.size ? ` (${i.size})` : ""} · €{fmt(Number(i.purchase_price ?? 0))}</option>
          ))}
        </select>
        <div style={{ position: "relative", width: 100 }}>
          <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 700, color: "var(--slate)" }}>€</span>
          <input type="number" step="0.5" min="0" value={offer} onChange={e => setOffer(e.target.value)} disabled={!item}
            placeholder="Offerta"
            style={{ width: "100%", padding: "7px 8px 7px 22px", borderRadius: 10, border: "1px solid var(--border)", background: item ? "var(--white)" : "var(--light)", color: "var(--ink)", fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>

      {/* P&L rows */}
      {rows.length > 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontSize: 11, color: "var(--slate)" }}>{r.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.value}</span>
            </div>
          ))}
          {/* Result row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0 4px", borderTop: "1.5px solid var(--border)", marginTop: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>Profitto</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: v!.color }}>{profit >= 0 ? "+" : ""}€{fmt(profit)} · {margin}%</span>
          </div>
          {/* Verdict + counter */}
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <div style={{ flex: 1, borderRadius: 10, padding: "7px 10px", background: v!.bg, border: `1px solid ${v!.border}`, textAlign: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: v!.color }}>{v!.icon} {v!.label}</span>
            </div>
            {v!.label !== "Accetta" && ctr > 0 && (
              <div style={{ flex: 1, borderRadius: 10, padding: "7px 10px", background: "rgba(0,119,130,.08)", border: "1px solid rgba(0,119,130,.2)", textAlign: "center" }}>
                <span style={{ fontSize: 11, color: "#007782", fontWeight: 700 }}>Proponi €{fmt(ctr)}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, borderRadius: 12, background: "var(--light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 12, color: "var(--slate)" }}>{item ? "Inserisci l'offerta" : "Seleziona un articolo"}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MOCKUP C — Visual Gauge (termometro del margine)
// ─────────────────────────────────────────────────────────────────
function MockupC({ items, photoMap }: { items: StockItem[]; photoMap: Record<string, string> }) {
  const [selId, setSelId]   = useState("");
  const [offer, setOffer]   = useState("");

  const item   = items.find(i => i.id === selId);
  const cost   = Number(item?.purchase_price ?? 0);
  const offerN = parseFloat(offer) || 0;
  const net    = offerN * (1 - VINTED_FEE);
  const profit = net - cost;
  const margin = cost > 0 ? Math.round((profit / cost) * 100) : 0;
  const v      = item && offerN > 0 ? verdict(margin) : null;
  const ctr    = cost > 0 ? counterOffer(cost) : 0;

  // Gauge: range da -50% a +80%, normalized 0..1
  const MIN_M = -50, MAX_M = 80;
  const pct = v ? Math.min(1, Math.max(0, (margin - MIN_M) / (MAX_M - MIN_M))) : null;
  // Soglie visive
  const breakEven = (0     - MIN_M) / (MAX_M - MIN_M);
  const good      = (10    - MIN_M) / (MAX_M - MIN_M);
  const great     = (30    - MIN_M) / (MAX_M - MIN_M);

  const photo = item?.template_id_ext ? photoMap[item.template_id_ext] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
      {/* Item + offer inputs in a row */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {photo
          ? <img src={photo} style={{ width: 34, height: 34, borderRadius: 9, objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }} alt="" />
          : <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--light)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📦</div>
        }
        <select
          value={selId}
          onChange={e => setSelId(e.target.value)}
          style={{ flex: 1, padding: "6px 8px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--light)", color: "var(--ink)", fontSize: 11, fontFamily: "inherit", outline: "none" }}
        >
          <option value="">Articolo…</option>
          {items.map(i => (
            <option key={i.id} value={i.id}>{i.name}{i.size ? ` · ${i.size}` : ""}</option>
          ))}
        </select>
        <div style={{ position: "relative", width: 88 }}>
          <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, fontWeight: 700, color: "var(--slate)" }}>€</span>
          <input type="number" step="0.5" min="0" value={offer} onChange={e => setOffer(e.target.value)} disabled={!item}
            placeholder="Offerta"
            style={{ width: "100%", padding: "6px 6px 6px 20px", borderRadius: 9, border: "1px solid var(--border)", background: item ? "var(--white)" : "var(--light)", color: "var(--ink)", fontSize: 11, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>

      {/* Gauge bar */}
      {pct !== null ? (
        <>
          <div style={{ position: "relative", height: 28 }}>
            {/* Track gradient */}
            <div style={{ position: "absolute", inset: "8px 0", borderRadius: 999, background: "linear-gradient(to right, #FF4D4D 0%, #f5a623 35%, #6bb800 65%, #007782 100%)", opacity: .25 }} />
            <div style={{ position: "absolute", inset: "8px 0", borderRadius: 999, background: "linear-gradient(to right, #FF4D4D 0%, #f5a623 35%, #6bb800 65%, #007782 100%)", clipPath: `inset(0 ${Math.round((1 - pct) * 100)}% 0 0 round 999px)`, opacity: .9 }} />
            {/* Tick marks */}
            {[breakEven, good, great].map((t, i) => (
              <div key={i} style={{ position: "absolute", top: 4, left: `${t * 100}%`, width: 1, height: 20, background: "var(--border)", transform: "translateX(-50%)" }} />
            ))}
            {/* Needle */}
            <div style={{ position: "absolute", top: 0, left: `${pct * 100}%`, transform: "translateX(-50%)", width: 12, height: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
              <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `7px solid ${v!.color}` }} />
              <div style={{ width: 2, height: 14, background: v!.color, borderRadius: 1 }} />
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: v!.color }} />
            </div>
          </div>

          {/* Labels under gauge */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--slate)", marginTop: -6 }}>
            <span>Perdita</span><span>Break-even</span><span>Buono</span><span>Ottimo</span>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 6, flex: 1 }}>
            <div style={{ flex: 1, borderRadius: 10, padding: "8px 10px", background: v!.bg, border: `1px solid ${v!.border}` }}>
              <div style={{ fontSize: 10, color: v!.color, fontWeight: 700, marginBottom: 2 }}>{v!.icon} {v!.label}</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: v!.color }}>{margin >= 0 ? "+" : ""}{margin}%</div>
              <div style={{ fontSize: 10, color: "var(--slate)", marginTop: 1 }}>{profit >= 0 ? "+" : ""}€{fmt(profit)} profitto</div>
            </div>
            {v!.label !== "Accetta" && ctr > 0 && (
              <div style={{ flex: 1, borderRadius: 10, padding: "8px 10px", background: "rgba(0,119,130,.08)", border: "1px solid rgba(0,119,130,.2)" }}>
                <div style={{ fontSize: 10, color: "#007782", fontWeight: 700, marginBottom: 2 }}>💬 Controproponi</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#007782" }}>€{fmt(ctr)}</div>
                <div style={{ fontSize: 10, color: "var(--slate)", marginTop: 1 }}>+30% margine target</div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ flex: 1, borderRadius: 12, background: "var(--light)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {item && cost > 0 && (
            <div style={{ fontSize: 11, color: "var(--slate)" }}>Costo: €{fmt(cost)} · min. €{fmt(counterOffer(cost))}</div>
          )}
          <span style={{ fontSize: 12, color: "var(--slate)" }}>{item ? "Inserisci l'offerta" : "Seleziona un articolo"}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SHELL: switcher A / B / C
// ─────────────────────────────────────────────────────────────────
export default function OfferCalculatorCard({ stockItems, photoMap = {} }: Props) {
  const [variant, setVariant] = useState<"A" | "B" | "C">("A");

  const available = useMemo(
    () => stockItems.filter(i => i.status === "available" || !i.status),
    [stockItems]
  );

  const titles = {
    A: "Quick Check",
    B: "Analisi P&L",
    C: "Gauge visivo",
  };

  return (
    <div style={{ background: "var(--white)", borderRadius: 20, border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", padding: "16px 18px", display: "flex", flexDirection: "column", minHeight: 200 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Valuta offerta</div>
          <div style={{ fontSize: 10, color: "#007782", fontWeight: 600 }}>MOCKUP {variant} · {titles[variant]}</div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {(["A", "B", "C"] as const).map(k => (
            <button
              key={k}
              onClick={() => setVariant(k)}
              style={{
                padding: "3px 10px", borderRadius: 999, border: "none",
                background: variant === k ? "#007782" : "var(--light)",
                color: variant === k ? "#fff" : "var(--slate)",
                fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all .15s",
              }}
            >{k}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {variant === "A" && <MockupA items={available} photoMap={photoMap} />}
        {variant === "B" && <MockupB items={available} photoMap={photoMap} />}
        {variant === "C" && <MockupC items={available} photoMap={photoMap} />}
      </div>
    </div>
  );
}
