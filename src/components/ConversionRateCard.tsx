"use client";
// src/components/ConversionRateCard.tsx
import { useState } from "react";

const GRN  = "#6bb800";   // venduti (completati)
const AMB  = "#F5A623";   // in sospeso
const V    = "#007782";   // disponibili (Vinted)
const RED  = "#FF4D4D";   // clearance
const DIM  = "rgba(235,235,235,0.35)";
const INK  = "var(--ink)";
const SL   = "var(--slate)";
const W    = "var(--white)";

type Selection = "all" | "venduti" | "stock" | "completati" | "sospeso" | "disponibili" | "clearance";

type Props = {
  sold:       number;
  pending:    number;
  available:  number;
  staleItems: number;
};

export default function ConversionRateCard({ sold, pending, available, staleItems }: Props) {
  const [sel, setSel] = useState<Selection>("all");

  const normalAvail = Math.max(available - staleItems, 0);
  const total       = sold + pending + available;

  const R   = 52;
  const ARC = Math.round(Math.PI * R);
  const GAP = 2000;
  const cx  = 70, cy = 70;
  const path = `M${cx - R},${cy} A${R},${R} 0 0,1 ${cx + R},${cy}`;

  const lenSold    = total > 0 ? Math.round((sold         / total) * ARC) : 0;
  const lenPending = total > 0 ? Math.round((pending      / total) * ARC) : 0;
  const lenNormal  = total > 0 ? Math.round((normalAvail  / total) * ARC) : 0;
  const lenStale   = ARC - lenSold - lenPending - lenNormal;

  // Which segments are active
  const active = (key: "completati"|"sospeso"|"disponibili"|"clearance") => {
    if (sel === "all") return true;
    if (sel === "venduti") return key === "completati" || key === "sospeso";
    if (sel === "stock")   return key === "disponibili" || key === "clearance";
    return sel === key;
  };

  const segColor = (key: "completati"|"sospeso"|"disponibili"|"clearance", color: string) =>
    active(key) ? color : DIM;

  // Displayed percentage
  const displayPct = () => {
    if (sel === "all") return Math.round(((sold + pending) / total) * 100);
    if (sel === "venduti" || sel === "completati" || sel === "sospeso") {
      const n = sel === "completati" ? sold : sel === "sospeso" ? pending : sold + pending;
      return total > 0 ? Math.round((n / total) * 100) : 0;
    }
    const n = sel === "disponibili" ? normalAvail : sel === "clearance" ? staleItems : available;
    return total > 0 ? Math.round((n / total) * 100) : 0;
  };

  function toggleGroup(grp: "venduti" | "stock") {
    setSel(prev => prev === grp ? "all" : grp);
  }
  function toggleItem(item: "completati" | "sospeso" | "disponibili" | "clearance") {
    setSel(prev => prev === item ? "all" : item);
  }

  const grpBorder = (grp: "venduti" | "stock") => {
    const color = grp === "venduti" ? GRN : V;
    const active = sel === grp || (grp === "venduti" && (sel === "completati" || sel === "sospeso")) ||
                                  (grp === "stock"   && (sel === "disponibili" || sel === "clearance"));
    return active ? `0 0 0 1.5px ${color}` : "none";
  };

  return (
    <>
      <style>{`
        .crc-root { background:var(--white); border-radius:20px; border:1px solid var(--border); box-shadow:0 4px 20px rgba(0,0,0,0.06); transition:background .35s, border-color .25s; padding:24px 24px 20px; display:flex; flex-direction:column; align-items:center; }
        .crc-title { font-size:11px; font-weight:600; color:var(--slate); text-transform:uppercase; letter-spacing:.06em; margin-bottom:14px; align-self:flex-start; }
        .crc-grp { border-radius:0 6px 6px 0; padding:8px 8px 8px 10px; cursor:pointer; transition:all .18s; }
        .crc-grp:hover { filter: brightness(0.97); }
        .crc-item { font-size:14px; font-weight:600; cursor:pointer; padding:1px 3px; border-radius:4px; transition:background .15s; display:inline-block; }
        .crc-item:hover { background: rgba(0,0,0,0.05); }
        .crc-hint { font-size:10px; color:var(--slate); margin-top:8px; opacity:0.65; }
      `}</style>

      <div className="crc-root">
        <div className="crc-title">Tasso conversione stock</div>

        <svg width="150" height="80" viewBox="0 0 140 76" style={{ overflow: "visible" }}>
          <path d={path} fill="none" stroke="var(--border)" strokeWidth="11" strokeLinecap="butt" />
          {lenSold > 0 && (
            <path d={path} fill="none" stroke={segColor("completati", GRN)} strokeWidth="11" strokeLinecap="butt"
              strokeDasharray={`${lenSold} ${GAP}`} strokeDashoffset={0} style={{ transition: "stroke .25s" }} />
          )}
          {lenPending > 0 && (
            <path d={path} fill="none" stroke={segColor("sospeso", AMB)} strokeWidth="11" strokeLinecap="butt"
              strokeDasharray={`${lenPending} ${GAP}`} strokeDashoffset={-lenSold} style={{ transition: "stroke .25s" }} />
          )}
          {lenNormal > 0 && (
            <path d={path} fill="none" stroke={segColor("disponibili", V)} strokeWidth="11" strokeLinecap="butt"
              strokeDasharray={`${lenNormal} ${GAP}`} strokeDashoffset={-(lenSold + lenPending)} style={{ transition: "stroke .25s" }} />
          )}
          {lenStale > 0 && (
            <path d={path} fill="none" stroke={segColor("clearance", RED)} strokeWidth="11" strokeLinecap="butt"
              strokeDasharray={`${lenStale} ${GAP}`} strokeDashoffset={-(lenSold + lenPending + lenNormal)} style={{ transition: "stroke .25s" }} />
          )}
          <text x="70" y="63" textAnchor="middle" fontSize="20" fontWeight="800" fill={INK} fontFamily="inherit">
            {displayPct()}%
          </text>
        </svg>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", marginTop: 10 }}>
          {/* Venduti */}
          <div className="crc-grp"
            style={{
              borderLeft: `3px solid ${GRN}`,
              background: "rgba(107,184,0,0.06)",
              boxShadow: grpBorder("venduti"),
            }}
            onClick={() => toggleGroup("venduti")}
          >
            <div style={{ fontSize: 10, color: SL, marginBottom: 4, fontWeight: 500 }}>Venduti</div>
            <div className="crc-item" style={{ color: GRN }}
              onClick={e => { e.stopPropagation(); toggleItem("completati"); }}>
              {sold} <span style={{ fontSize: 11, fontWeight: 400, color: SL }}>completati</span>
            </div>
            <div className="crc-item" style={{ color: AMB }}
              onClick={e => { e.stopPropagation(); toggleItem("sospeso"); }}>
              {pending} <span style={{ fontSize: 11, fontWeight: 400, color: SL }}>in sospeso</span>
            </div>
          </div>

          {/* Stock */}
          <div className="crc-grp"
            style={{
              borderLeft: `3px solid ${V}`,
              background: "rgba(0,119,130,0.04)",
              boxShadow: grpBorder("stock"),
            }}
            onClick={() => toggleGroup("stock")}
          >
            <div style={{ fontSize: 10, color: SL, marginBottom: 4, fontWeight: 500 }}>Stock</div>
            <div className="crc-item" style={{ color: V }}
              onClick={e => { e.stopPropagation(); toggleItem("disponibili"); }}>
              {normalAvail} <span style={{ fontSize: 11, fontWeight: 400, color: SL }}>disponibili</span>
            </div>
            <div className="crc-item" style={{ color: RED }}
              onClick={e => { e.stopPropagation(); toggleItem("clearance"); }}>
              {staleItems} <span style={{ fontSize: 11, fontWeight: 400, color: SL }}>clearance</span>
            </div>
          </div>
        </div>

        <div className="crc-hint">
          {sel === "all" ? "Clicca per evidenziare" : "Clicca di nuovo per deselezionare"}
        </div>
      </div>
    </>
  );
}
