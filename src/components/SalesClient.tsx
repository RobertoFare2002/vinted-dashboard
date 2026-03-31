"use client";
// src/components/SalesClient.tsx
import { useState, useMemo, useTransition } from "react";
import { deleteSale, changeSaleStatus } from "@/app/(dashboard)/sales/actions";
import { cancelSale, concludeSale } from "@/app/(dashboard)/stock/actions";
import SaleModal from "@/components/SaleModal";

type SaleRow = {
  id: string; buyer_seller: string | null; amount: number | null; cost: number | null;
  platform: string | null; status: string | null; notes: string | null;
  transaction_date: string | null; template_id_ext: string | null;
  profile_id: string | null; raw_data: { stock_id?: string; bulk_id?: string; bulk_size?: number } | null;
};
type Template = { id: string; name: string };
type Props = {
  initialSales: SaleRow[];
  templates:    Template[];
  photoMap:     Record<string, string>;
  profileMap:   Record<string, string>;
  profiles:     { id: string; name: string }[];
};

const G = {
  glass:   "rgba(255,255,255,.045)",
  border:  "rgba(255,255,255,.08)",
  blur:    "blur(20px)",
  accent:  "#00e5c3",
  danger:  "#ff4d6d",
  amber:   "#f59e0b",
  blue:    "#4f8ef7",
};

const STATUS_META = {
  open:   { label: "In sospeso", color: G.amber,  bg: "rgba(245,158,11,.12)",  border: "rgba(245,158,11,.25)"  },
  closed: { label: "Conclusa",   color: G.accent, bg: "rgba(0,229,195,.10)",   border: "rgba(0,229,195,.22)"   },
};

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function GlassBtn({ onClick, children, color = G.accent, disabled = false }: {
  onClick: () => void; children: React.ReactNode; color?: string; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, padding: "11px", borderRadius: 12,
      border: `1px solid ${color}30`,
      background: `${color}15`,
      backdropFilter: G.blur,
      WebkitBackdropFilter: G.blur,
      color, cursor: disabled ? "not-allowed" : "pointer",
      fontSize: 13, fontWeight: 700, opacity: disabled ? .5 : 1,
      transition: "all .15s",
      fontFamily: "inherit",
      outline: "none",
      appearance: "none" as any,
      WebkitAppearance: "none" as any,
    }}>
      {children}
    </button>
  );
}

export default function SalesClient({ initialSales, templates, photoMap, profileMap, profiles }: Props) {
  const [modal, setModal]               = useState<{ mode: "add" | "edit"; sale?: SaleRow } | null>(null);
  const [filter, setFilter]             = useState<"all" | "open" | "closed">("all");
  const [search, setSearch]             = useState("");
  const [filterProfile, setFilterProfile] = useState("");
  const [filterYear,    setFilterYear]    = useState("");
  const [filterMonth,   setFilterMonth]   = useState("");
  const [isPending, startTransition]    = useTransition();
  const [actionId, setActionId]         = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<{ saleId: string; stockId: string } | null>(null);
  const [expanded, setExpanded]         = useState<string | null>(null);

  // Anni disponibili
  const years = useMemo(() => {
    const s = new Set<string>();
    for (const sale of initialSales) {
      const y = String(sale.transaction_date ?? "").slice(0, 4);
      if (y.length === 4) s.add(y);
    }
    return Array.from(s).sort().reverse();
  }, [initialSales]);

  // Filtro base: profilo + anno + mese — usato per KPI e lista
  const baseFiltered = useMemo(() => {
    let list = initialSales;
    if (filterProfile) {
      const profileName = profiles.find(p => p.id === filterProfile)?.name ?? "";
      list = list.filter(s => s.profile_id === filterProfile || s.profile_id === profileName);
    }
    if (filterYear)  list = list.filter(s => String(s.transaction_date ?? "").slice(0, 4) === filterYear);
    if (filterMonth) list = list.filter(s => String(s.transaction_date ?? "").slice(5, 7) === filterMonth);
    return list;
  }, [initialSales, filterProfile, filterYear, filterMonth, profiles]);

  const sales = useMemo(() => {
    let list = baseFiltered;
    if (filter !== "all") list = list.filter(s => s.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s =>
        (s.buyer_seller ?? "").toLowerCase().includes(q) ||
        (s.notes ?? "").toLowerCase().includes(q) ||
        (s.profile_id ? (profileMap[s.profile_id] ?? s.profile_id) : "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [baseFiltered, filter, search, profileMap]);

  const revenue = baseFiltered.filter(s => s.status === "closed").reduce((a, s) => a + Number(s.amount ?? 0), 0);
  const costs   = baseFiltered.reduce((a, s) => a + Number(s.cost ?? 0), 0);
  const profit  = revenue - costs;
  const pending = baseFiltered.filter(s => s.status === "open").reduce((a, s) => a + Number(s.amount ?? 0), 0);

  function handleDelete(id: string) {
    setConfirmDelete(null); setActionId(id);
    startTransition(async () => { await deleteSale(id); setActionId(null); });
  }
  function handleToggle(s: SaleRow) {
    const next = s.status === "open" ? "closed" : "open";
    setActionId(s.id);
    startTransition(async () => { await changeSaleStatus(s.id, next as "open" | "closed"); setActionId(null); });
  }
  function handleCancel(saleId: string, stockId: string) {
    setConfirmCancel(null); setActionId(saleId);
    startTransition(async () => { await cancelSale({ saleId, stockId }); setActionId(null); });
  }
  function handleConclude(saleId: string, stockId: string) {
    setActionId(saleId);
    startTransition(async () => { await concludeSale({ saleId, stockId }); setActionId(null); });
  }

  const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 90,
    background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "flex-end",
  };
  const sheetStyle: React.CSSProperties = {
    background: "rgba(8,10,20,.97)",
    border: "1px solid rgba(255,255,255,.1)",
    borderRadius: "20px 20px 0 0",
    backdropFilter: "blur(40px)",
    WebkitBackdropFilter: "blur(40px)",
    padding: "20px 18px 32px",
    width: "100%", maxWidth: 560,
    margin: "0 auto", maxHeight: "85vh", overflowY: "auto",
    color: "rgba(255,255,255,.9)",
  };

  return (
    <>
      {/* Reset stili browser per tutti i button dentro SalesClient */}
      <style>{`
        .sales-client button {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          border: none;
          color: inherit;
          font-family: inherit;
          box-shadow: none;
        }
        .sales-client input {
          -webkit-appearance: none;
          appearance: none;
          background: rgba(255,255,255,.045);
          color: rgba(255,255,255,.85);
          font-family: inherit;
          box-shadow: none;
        }
      `}</style>

      <div className="sales-client">
        {modal && <SaleModal mode={modal.mode} sale={modal.sale} templates={templates} profiles={profiles} onClose={() => setModal(null)} />}

        {confirmDelete && (
          <div style={overlayStyle} onClick={() => setConfirmDelete(null)}>
            <div style={{ ...sheetStyle, borderColor: "rgba(255,77,109,.2)" }} onClick={e => e.stopPropagation()}>
              <div style={{ width: 36, height: 4, background: "rgba(255,255,255,.15)", borderRadius: 2, margin: "0 auto 20px" }} />
              <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Elimina vendita?</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 24 }}>Questa azione non può essere annullata.</div>
              <div style={{ display: "flex", gap: 10 }}>
                <GlassBtn onClick={() => setConfirmDelete(null)} color="rgba(255,255,255,.4)">Annulla</GlassBtn>
                <GlassBtn onClick={() => handleDelete(confirmDelete)} color={G.danger}>Elimina</GlassBtn>
              </div>
            </div>
          </div>
        )}

        {confirmCancel && (
          <div style={overlayStyle} onClick={() => setConfirmCancel(null)}>
            <div style={{ ...sheetStyle, borderColor: "rgba(245,158,11,.2)" }} onClick={e => e.stopPropagation()}>
              <div style={{ width: 36, height: 4, background: "rgba(255,255,255,.15)", borderRadius: 2, margin: "0 auto 20px" }} />
              <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Annulla vendita?</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 24 }}>L&apos;articolo tornerà disponibile in magazzino.</div>
              <div style={{ display: "flex", gap: 10 }}>
                <GlassBtn onClick={() => setConfirmCancel(null)} color="rgba(255,255,255,.4)">Chiudi</GlassBtn>
                <GlassBtn onClick={() => handleCancel(confirmCancel.saleId, confirmCancel.stockId)} color={G.amber}>Annulla vendita</GlassBtn>
              </div>
            </div>
          </div>
        )}

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          {[
            { label: "Ricavi",     value: `€${fmt(revenue)}`, color: G.accent, glow: "rgba(0,229,195,.2)"  },
            { label: "Costi",      value: `€${fmt(costs)}`,   color: G.danger, glow: "rgba(255,77,109,.2)" },
            { label: "Profitto",   value: `€${fmt(profit)}`,  color: profit >= 0 ? G.accent : G.danger, glow: profit >= 0 ? "rgba(0,229,195,.2)" : "rgba(255,77,109,.2)" },
            { label: "In sospeso", value: `€${fmt(pending)}`, color: G.amber,  glow: "rgba(245,158,11,.2)" },
          ].map(k => (
            <div key={k.label} style={{
              background: G.glass, border: `1px solid ${G.border}`,
              borderBottom: `2px solid ${k.color}`,
              backdropFilter: G.blur, borderRadius: 14,
              padding: "14px 16px", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: `linear-gradient(to top, ${k.glow}, transparent)`, pointerEvents: "none" }} />
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, marginBottom: 7 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: k.color, letterSpacing: "-.03em" }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button onClick={() => setModal({ mode: "add" })} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "11px 18px", borderRadius: 12, flexShrink: 0,
            border: `1px solid rgba(0,229,195,.3)`,
            background: "rgba(0,229,195,.10)", backdropFilter: G.blur,
            color: G.accent, cursor: "pointer", fontSize: 13, fontWeight: 700,
            boxShadow: "0 0 20px rgba(0,229,195,.08)",
            fontFamily: "inherit",
          }}>＋ Vendita</button>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca..."
            style={{
              flex: 1, padding: "11px 14px", borderRadius: 12,
              border: `1px solid ${G.border}`, background: G.glass,
              backdropFilter: G.blur, color: "rgba(255,255,255,.85)",
              fontSize: 13, outline: "none", fontFamily: "inherit",
            }} />
        </div>

        {/* Sottotitolo dinamico */}
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginBottom: 10 }}>
          {baseFiltered.length} vendite{filterProfile || filterYear ? " · filtrate" : " totali"}
          {filterProfile && (() => { const n = profiles.find(p => p.id === filterProfile)?.name; return n ? ` · ${n}` : ""; })()}
          {filterYear && ` · ${filterYear}`}
          {filterMonth && ` · ${["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"][parseInt(filterMonth)-1]}`}
        </div>

        {/* Filtri profilo + data */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" as const }}>
          <select value={filterProfile} onChange={e => setFilterProfile(e.target.value)} style={{
            flex: 1, minWidth: 0, padding: "11px 12px", borderRadius: 12, boxSizing: "border-box" as const,
            border: `1px solid ${filterProfile ? "rgba(0,229,195,.3)" : G.border}`,
            background: filterProfile ? "rgba(0,229,195,.08)" : G.glass,
            backdropFilter: G.blur, color: filterProfile ? G.accent : "rgba(255,255,255,.55)",
            fontSize: 13, outline: "none", fontFamily: "inherit",
            colorScheme: "dark", cursor: "pointer",
          }}>
            <option value="">Tutti i profili</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select value={filterYear} onChange={e => { setFilterYear(e.target.value); if (!e.target.value) setFilterMonth(""); }} style={{
            padding: "11px 12px", borderRadius: 12, flexShrink: 0,
            border: `1px solid ${filterYear ? "rgba(0,229,195,.3)" : G.border}`,
            background: filterYear ? "rgba(0,229,195,.08)" : G.glass,
            backdropFilter: G.blur, color: filterYear ? G.accent : "rgba(255,255,255,.55)",
            fontSize: 13, outline: "none", fontFamily: "inherit",
            colorScheme: "dark", cursor: "pointer",
          }}>
            <option value="">Anno</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {filterYear && (
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{
              padding: "11px 12px", borderRadius: 12, flexShrink: 0,
              border: `1px solid ${filterMonth ? "rgba(0,229,195,.3)" : G.border}`,
              background: filterMonth ? "rgba(0,229,195,.08)" : G.glass,
              backdropFilter: G.blur, color: filterMonth ? G.accent : "rgba(255,255,255,.55)",
              fontSize: 13, outline: "none", fontFamily: "inherit",
              colorScheme: "dark", cursor: "pointer",
            }}>
              <option value="">Mese</option>
              {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m, i) => (
                <option key={m} value={m}>{["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"][i]}</option>
              ))}
            </select>
          )}
        </div>

        {/* Filtri */}
        <div style={{ display: "flex", gap: 3, marginBottom: 14, background: "rgba(255,255,255,.03)", borderRadius: 12, padding: 3 }}>
          {([["all", "Tutti"], ["open", "Sospeso"], ["closed", "Concluse"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              flex: 1, padding: "9px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: filter === k ? `1px solid rgba(0,229,195,.25)` : "1px solid transparent",
              background: filter === k ? "rgba(0,229,195,.10)" : "transparent",
              backdropFilter: filter === k ? G.blur : "none",
              color: filter === k ? G.accent : "rgba(255,255,255,.4)",
              transition: "all .15s",
              fontFamily: "inherit",
            }}>{l}</button>
          ))}
        </div>

        {/* Lista */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sales.length === 0 && (
            <div style={{ textAlign: "center", padding: "56px 0", color: "rgba(255,255,255,.25)", fontSize: 14 }}>Nessuna vendita trovata</div>
          )}
          {sales.map(s => {
            const st    = STATUS_META[s.status as keyof typeof STATUS_META] ?? STATUS_META.open;
            const thumb = s.template_id_ext ? photoMap[s.template_id_ext] : null;
            const margin = s.cost && Number(s.cost) > 0 ? Math.round(((Number(s.amount ?? 0) - Number(s.cost)) / Number(s.cost)) * 100) : null;
            const gain  = Number(s.amount ?? 0) - Number(s.cost ?? 0);
            const busy  = isPending && actionId === s.id;
            const isOpen = expanded === s.id;
            const gainColor = gain >= 0 ? G.accent : G.danger;
            const profileName = s.profile_id ? (profileMap[s.profile_id] ?? s.profile_id) : null;

            return (
              <div key={s.id} style={{
                background: "rgba(255,255,255,.045)",
                border: `1px solid rgba(255,255,255,.08)`,
                backdropFilter: G.blur,
                WebkitBackdropFilter: G.blur,
                borderRadius: 16,
                overflow: "hidden", opacity: busy ? .5 : 1,
                transition: "all .2s",
                boxShadow: isOpen ? "0 8px 32px rgba(0,0,0,.4)" : "none",
              }}>
                {/* Riga principale */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", cursor: "pointer" }}
                  onClick={() => setExpanded(isOpen ? null : s.id)}>
                  <div style={{ width: 50, height: 50, borderRadius: 11, overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,.05)", border: `1px solid ${G.border}` }}>
                    {thumb
                      ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, opacity: .3 }}>📦</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>
                      {s.buyer_seller || "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", display: "flex", gap: 5 }}>
                      <span>{s.transaction_date ? new Date(s.transaction_date).toLocaleDateString("it") : "—"}</span>
                      {profileName && <><span>·</span><span>{profileName}</span></>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-.02em" }}>€{fmt(Number(s.amount ?? 0))}</div>
                    {margin !== null && <div style={{ fontSize: 11, fontWeight: 700, color: gainColor }}>▲ {margin}%</div>}
                  </div>
                  <div style={{ fontSize: 16, color: "rgba(255,255,255,.2)", marginLeft: 2 }}>{isOpen ? "▾" : "▸"}</div>
                </div>

                {/* Badge stato */}
                <div style={{ padding: "0 14px 12px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => handleToggle(s)} style={{
                    padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
                    border: `1px solid ${st.border}`, background: st.bg,
                    backdropFilter: G.blur, color: st.color, transition: "all .15s",
                    fontFamily: "inherit",
                  }}>{st.label}</button>
                  {s.raw_data?.bulk_id && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 10,
                      background: "rgba(79,142,247,.12)", border: "1px solid rgba(79,142,247,.3)",
                      color: "#4f8ef7", letterSpacing: ".02em",
                    }}>🔗 Blocco {s.raw_data.bulk_size ? `×${s.raw_data.bulk_size}` : ""}</span>
                  )}
                  <span style={{ fontSize: 11, color: gainColor, fontWeight: 700 }}>{gain > 0 ? "+" : ""}€{fmt(gain)}</span>
                </div>

                {/* Azioni espanse */}
                {isOpen && (
                  <div style={{
                    borderTop: `1px solid rgba(255,255,255,.08)`,
                    padding: "12px 14px",
                    display: "flex", gap: 8, flexWrap: "wrap",
                    background: "rgba(0,0,0,.25)",
                  }}>
                    <GlassBtn onClick={() => { setExpanded(null); setModal({ mode: "edit", sale: s }); }} color="rgba(255,255,255,.5)">✏️ Modifica</GlassBtn>
                    {s.raw_data?.stock_id && s.status === "open" && (
                      <GlassBtn onClick={() => handleConclude(s.id, s.raw_data!.stock_id!)} color={G.accent}>✅ Concludi</GlassBtn>
                    )}
                    {s.raw_data?.stock_id && (
                      <GlassBtn onClick={() => setConfirmCancel({ saleId: s.id, stockId: s.raw_data!.stock_id! })} color={G.amber}>↩ Annulla</GlassBtn>
                    )}
                    <button onClick={() => setConfirmDelete(s.id)} style={{
                      padding: "11px 14px", borderRadius: 12,
                      border: `1px solid rgba(255,77,109,.25)`,
                      background: "rgba(255,77,109,.08)",
                      color: G.danger, cursor: "pointer", fontSize: 14,
                      fontFamily: "inherit",
                    }}>🗑</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ height: 24 }} />
      </div>
    </>
  );
}
