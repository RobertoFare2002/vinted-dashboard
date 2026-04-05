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
  profile_id: string | null; raw_data: { stock_id?: string } | null;
};
type Template = { id: string; name: string };
type Props = {
  initialSales: SaleRow[];
  templates:    Template[];
  photoMap:     Record<string, string>;
  profileMap:   Record<string, string>;
  profiles:     { id: string; name: string }[];
};

const G   = "#007782";
const GBG = "#f0fad0";
const RED = "#FF4D4D";
const AMB = "#F5A623";
const INK = "#111111";
const SL  = "#888888";
const BD  = "#EBEBEB";
const LT  = "#F5F5F5";
const W   = "#ffffff";

const STATUS_META: Record<string, { label: string; dot: string; color: string; bg: string }> = {
  open:   { label: "In sospeso", dot: AMB,      color: AMB,      bg: "#fef3c7" },
  closed: { label: "Conclusa",   dot: "#6bb800", color: "#6bb800", bg: GBG },
};

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SalesClient({ initialSales, templates, photoMap, profileMap, profiles }: Props) {
  const [modal, setModal]               = useState<{ mode: "add" | "edit"; sale?: SaleRow } | null>(null);
  const [filter, setFilter]             = useState<"all" | "open" | "closed">("all");
  const [search, setSearch]             = useState("");
  const [isPending, startTransition]    = useTransition();
  const [actionId, setActionId]         = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<{ saleId: string; stockId: string } | null>(null);
  const [expanded, setExpanded]         = useState<string | null>(null);

  const sales = useMemo(() => {
    let list = initialSales;
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
  }, [initialSales, filter, search, profileMap]);

  const revenue = initialSales.filter(s => s.status === "closed").reduce((a, s) => a + Number(s.amount ?? 0), 0);
  const costs   = initialSales.reduce((a, s) => a + Number(s.cost ?? 0), 0);
  const profit  = revenue - costs;
  const pending = initialSales.filter(s => s.status === "open").reduce((a, s) => a + Number(s.amount ?? 0), 0);

  function handleDelete(id: string) { setConfirmDelete(null); setActionId(id); startTransition(async () => { await deleteSale(id); setActionId(null); }); }
  function handleToggle(s: SaleRow) { const next = s.status === "open" ? "closed" : "open"; setActionId(s.id); startTransition(async () => { await changeSaleStatus(s.id, next as "open" | "closed"); setActionId(null); }); }
  function handleCancel(saleId: string, stockId: string) { setConfirmCancel(null); setActionId(saleId); startTransition(async () => { await cancelSale({ saleId, stockId }); setActionId(null); }); }
  function handleConclude(saleId: string, stockId: string) { setActionId(saleId); startTransition(async () => { await concludeSale({ saleId, stockId }); setActionId(null); }); }

  const overlayStyle: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,.35)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 };
  const dialogStyle: React.CSSProperties = { background: W, border: "none", borderRadius: 20, padding: "24px 20px", maxWidth: 400, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,.14)" };

  return (
    <>
      {modal && <SaleModal mode={modal.mode} sale={modal.sale} templates={templates} profiles={profiles} onClose={() => setModal(null)} />}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div style={overlayStyle} onClick={() => setConfirmDelete(null)}>
          <div style={dialogStyle} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: INK }}>Elimina vendita?</div>
            <div style={{ fontSize: 13, color: SL, marginBottom: 20 }}>Questa azione non può essere annullata.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} className="btn btn-outline" style={{ flex: 1 }}>Annulla</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ flex: 1, padding: "10px 18px", borderRadius: 999, border: `1px solid ${RED}30`, background: `${RED}08`, color: RED, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Elimina</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Cancel */}
      {confirmCancel && (
        <div style={overlayStyle} onClick={() => setConfirmCancel(null)}>
          <div style={dialogStyle} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: INK }}>Annulla vendita?</div>
            <div style={{ fontSize: 13, color: SL, marginBottom: 20 }}>L&apos;articolo tornerà disponibile in magazzino.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmCancel(null)} className="btn btn-outline" style={{ flex: 1 }}>Chiudi</button>
              <button onClick={() => handleCancel(confirmCancel.saleId, confirmCancel.stockId)} style={{ flex: 1, padding: "10px 18px", borderRadius: 999, border: `1px solid ${AMB}40`, background: `${AMB}10`, color: AMB, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Annulla vendita</button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Ricavi",     value: `€${fmt(revenue)}`, color: "#6bb800" },
          { label: "Costi",      value: `€${fmt(costs)}`,   color: RED },
          { label: "Profitto",   value: `€${fmt(profit)}`,  color: profit >= 0 ? "#6bb800" : RED },
          { label: "In sospeso", value: `€${fmt(pending)}`, color: AMB },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 10, color: SL, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 600, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setModal({ mode: "add" })} style={{ background: "#007782", color: "#ffffff", padding: "10px 18px", fontWeight: 700, fontSize: 13, borderRadius: 999, border: "none", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>+ Vendita</button>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca..."
          style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "none", background: W, color: INK, fontSize: 13, outline: "none", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }} />
      </div>

      {/* Filtri tab */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {([["all", "Tutti"], ["open", "Sospeso"], ["closed", "Concluse"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: "7px 16px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: "none", fontFamily: "inherit",
            background: filter === k ? INK : LT,
            color: filter === k ? W : SL,
            transition: "all .15s",
          }}>{l}</button>
        ))}
      </div>

      {/* Lista vendite */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sales.length === 0 && <div style={{ textAlign: "center", padding: "56px 0", color: SL, fontSize: 14 }}>Nessuna vendita trovata</div>}
        {sales.map(s => {
          const st    = STATUS_META[s.status as keyof typeof STATUS_META] ?? STATUS_META.open;
          const thumb = s.template_id_ext ? photoMap[s.template_id_ext] : null;
          const margin = s.cost && Number(s.cost) > 0 ? Math.round(((Number(s.amount ?? 0) - Number(s.cost)) / Number(s.cost)) * 100) : null;
          const gain   = Number(s.amount ?? 0) - Number(s.cost ?? 0);
          const busy   = isPending && actionId === s.id;
          const isOpen = expanded === s.id;
          const gainColor = gain >= 0 ? "#6bb800" : RED;
          const profileName = s.profile_id ? (profileMap[s.profile_id] ?? s.profile_id) : null;

          return (
            <div key={s.id} className="card" style={{ padding: 0, opacity: busy ? .5 : 1, transition: "all .2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", cursor: "pointer" }}
                onClick={() => setExpanded(isOpen ? null : s.id)}>
                {/* Thumbnail */}
                <div style={{ width: 46, height: 46, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: LT }}>
                  {thumb
                    ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: SL }}>📦</div>}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4, color: INK }}>{s.buyer_seller || "—"}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* Status dot badge */}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: st.color }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, display: "inline-block" }} />
                      {st.label}
                    </span>
                    {profileName && <span style={{ fontSize: 11, color: SL }}>· {profileName}</span>}
                    <span style={{ fontSize: 11, color: SL }}>
                      {s.transaction_date ? "· " + new Date(s.transaction_date).toLocaleDateString("it") : ""}
                    </span>
                  </div>
                </div>
                {/* Amount */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-.02em", color: INK, fontVariantNumeric: "tabular-nums" }}>€{fmt(Number(s.amount ?? 0))}</div>
                  {margin !== null && <div style={{ fontSize: 11, fontWeight: 700, color: gainColor }}>{gain >= 0 ? "+" : ""}{margin}%</div>}
                </div>
                <div style={{ fontSize: 14, color: SL, marginLeft: 2, opacity: .4 }}>{isOpen ? "▾" : "▸"}</div>
              </div>

              {/* Expanded actions */}
              {isOpen && (
                <div style={{ borderTop: `1px solid ${BD}`, padding: "12px 16px", display: "flex", gap: 8, flexWrap: "wrap", background: LT, borderRadius: "0 0 20px 20px" }}>
                  <button onClick={() => handleToggle(s)} style={{ padding: "7px 14px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${s.status === "closed" ? AMB : "#007782"}`, background: "transparent", color: s.status === "closed" ? AMB : "#6bb800", fontFamily: "inherit" }}>
                    {s.status === "closed" ? "→ Riapri" : "✓ Concludi"}
                  </button>
                  <button onClick={() => { setExpanded(null); setModal({ mode: "edit", sale: s }); }} className="btn btn-outline" style={{ flex: 1 }}>Modifica</button>
                  {s.raw_data?.stock_id && s.status === "open" && (
                    <button onClick={() => handleConclude(s.id, s.raw_data!.stock_id!)} style={{ background: "#007782", color: "#ffffff", flex: 1, padding: "10px 18px", borderRadius: 999, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Concludi</button>
                  )}
                  {s.raw_data?.stock_id && (
                    <button onClick={() => setConfirmCancel({ saleId: s.id, stockId: s.raw_data!.stock_id! })} style={{ flex: 1, padding: "10px 18px", borderRadius: 999, border: `1px solid ${AMB}40`, background: `${AMB}08`, color: AMB, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>↩ Annulla</button>
                  )}
                  <button onClick={() => setConfirmDelete(s.id)} style={{ padding: "10px 12px", borderRadius: 12, border: `1px solid ${RED}20`, background: `${RED}05`, color: RED, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>🗑</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
