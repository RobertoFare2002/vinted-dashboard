"use client";
// src/components/StockClient.tsx
import { useState, useMemo, useTransition } from "react";
import { deleteStockItem } from "@/app/(dashboard)/stock/actions";
import SellModal from "@/components/SellModal";
import dynamic from "next/dynamic";
const StockEditModal = dynamic(() => import("./StockEditModal"), { ssr: false });

type StockItem = {
  id: string; name: string|null; size: string|null; quantity: number|null;
  purchase_price: number|null; status: string|null; purchased_at: string|null;
  profile_id: string|null; external_id: string|null; location: string|null;
  template_id_ext: string|null;
};
type Profile = { id: string; name: string };
type Props = { initialItems: StockItem[]; photoMap: Record<string, string>; profileMap: Record<string, string>; profiles: Profile[] };

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
  available: { label: "Disponibile", dot: "#6bb800", color: "#6bb800", bg: GBG },
  reserved:  { label: "In sospeso",  dot: AMB,       color: AMB,       bg: "#fef3c7" },
  sold:      { label: "Venduto",     dot: SL,        color: SL,        bg: LT },
  archived:  { label: "Archiviato",  dot: SL,        color: SL,        bg: LT },
};

function fmt(n: number) { return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function daysSince(d: string | null) { if (!d) return 0; return Math.floor((Date.now() - new Date(d).getTime()) / 86400000); }

export default function StockClient({ initialItems, photoMap, profileMap, profiles }: Props) {
  const [filterStatus, setFilterStatus] = useState("available");
  const [search, setSearch]             = useState("");
  const [sellTarget, setSellTarget]     = useState<StockItem | null>(null);
  const [editTarget, setEditTarget]     = useState<StockItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isPending, startTransition]    = useTransition();
  const [actionId, setActionId]         = useState<string | null>(null);

  const items = useMemo(() => {
    let list = initialItems;
    if (filterStatus !== "all") list = list.filter(i => i.status === filterStatus);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i =>
        (i.name ?? "").toLowerCase().includes(q) ||
        (i.profile_id ? (profileMap[i.profile_id] ?? i.profile_id) : "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [initialItems, filterStatus, search, profileMap]);

  const available = initialItems.filter(i => i.status === "available");
  const reserved  = initialItems.filter(i => i.status === "reserved");
  const totalCost = available.reduce((s, i) => s + Number(i.purchase_price ?? 0) * Number(i.quantity ?? 1), 0);
  const stale     = available.filter(i => daysSince(i.purchased_at) > 60).length;

  function handleDelete(id: string) { setConfirmDelete(null); setActionId(id); startTransition(async () => { await deleteStockItem(id); setActionId(null); }); }

  return (
    <>
      {sellTarget && <SellModal item={sellTarget} thumb={sellTarget.template_id_ext ? (photoMap[sellTarget.template_id_ext] ?? null) : null} onClose={() => setSellTarget(null)} />}
      {editTarget && <StockEditModal item={editTarget} thumb={editTarget.template_id_ext ? (photoMap[editTarget.template_id_ext] ?? null) : null} onClose={() => setEditTarget(null)} profiles={profiles} />}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,.35)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setConfirmDelete(null)}>
          <div style={{ background: W, border: "none", borderRadius: 20, padding: "24px 20px", maxWidth: 400, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,.14)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: INK }}>Elimina articolo?</div>
            <div style={{ fontSize: 13, color: SL, marginBottom: 20 }}>L&apos;articolo verrà rimosso dal magazzino.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} className="btn btn-outline" style={{ flex: 1 }}>Annulla</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ flex: 1, padding: "10px 18px", borderRadius: 999, border: `1px solid ${RED}30`, background: `${RED}08`, color: RED, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Elimina</button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Disponibili", value: String(available.reduce((s, i) => s + Number(i.quantity ?? 1), 0)), color: "#6bb800" },
          { label: "In sospeso",  value: String(reserved.length),   color: AMB },
          { label: "Costo tot.",  value: `€${fmt(totalCost)}`,      color: RED },
          { label: ">60gg",       value: String(stale),             color: stale > 0 ? AMB : SL },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: "16px 14px" }}>
            <div style={{ fontSize: 10, color: SL, textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 600, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: k.color, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filtri tab */}
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {([["available", "Disponibili"], ["reserved", "Sospeso"], ["sold", "Venduti"], ["all", "Tutti"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilterStatus(k)} style={{
            padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: "none", fontFamily: "inherit",
            background: filterStatus === k ? INK : LT,
            color: filterStatus === k ? W : SL,
            transition: "all .15s",
          }}>{l}</button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca articolo, profilo..."
          style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "none", background: W, color: INK, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }} />
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: SL }}>{items.length}/{initialItems.length}</span>
      </div>

      {/* Lista articoli */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: SL, fontSize: 14 }}>Nessun articolo</div>}
        {items.map(item => {
          const st    = STATUS_META[item.status as keyof typeof STATUS_META] ?? STATUS_META.available;
          const thumb = item.template_id_ext ? photoMap[item.template_id_ext] : null;
          const days  = daysSince(item.purchased_at);
          const isStale = days > 60;
          const busy  = isPending && actionId === item.id;
          const profileName = item.profile_id ? (profileMap[item.profile_id] ?? item.profile_id) : null;

          return (
            <div key={item.id} className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", opacity: busy ? .5 : 1, transition: "all .2s" }}>
              {/* Thumbnail */}
              <div style={{ width: 50, height: 50, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: LT }}>
                {thumb
                  ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: SL }}>📦</div>}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4, color: INK }}>{item.name || "—"}</div>
                <div style={{ fontSize: 11, color: SL, display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 5 }}>
                  {item.size && <span>T. {item.size}</span>}
                  {item.purchased_at && <span>· {new Date(item.purchased_at).toLocaleDateString("it")}</span>}
                  {profileName && <span>· {profileName}</span>}
                </div>
                {/* Status dot badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: st.color }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, display: "inline-block" }} />
                    {st.label}
                  </span>
                  {isStale && <span style={{ fontSize: 10, color: AMB, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>⚠ {days}gg</span>}
                </div>
              </div>

              {/* Price + Actions */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-.02em", color: INK, fontVariantNumeric: "tabular-nums" }}>€{fmt(Number(item.purchase_price ?? 0))}</div>
                {item.status === "available" && (
                  <button onClick={() => setSellTarget(item)} style={{ background: "#007782", color: "#ffffff", padding: "6px 16px", fontSize: 12, fontWeight: 700, borderRadius: 999, border: "none", cursor: "pointer", fontFamily: "inherit" }}>Vendi</button>
                )}
                {item.status === "reserved" && (
                  <span style={{ fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4, color: AMB }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: AMB, display: "inline-block" }} /> Sospeso
                  </span>
                )}
                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={() => setEditTarget(item)} className="btn btn-outline" style={{ padding: "5px 10px", fontSize: 13 }}>✏️</button>
                  <button onClick={() => setConfirmDelete(item.id)} style={{ padding: "5px 10px", borderRadius: 12, border: `1px solid ${RED}20`, background: `${RED}05`, color: RED, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>🗑</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
