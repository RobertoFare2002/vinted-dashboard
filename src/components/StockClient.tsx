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
type Props = {
  initialItems: StockItem[];
  photoMap:     Record<string, string>;
  profileMap:   Record<string, string>;
  profiles:     { id: string; name: string }[];
};

const G = {
  glass:  "rgba(255,255,255,.045)",
  border: "rgba(255,255,255,.08)",
  blur:   "blur(20px)",
  accent: "#00e5c3",
  danger: "#ff4d6d",
  amber:  "#f59e0b",
  blue:   "#4f8ef7",
};

const STATUS_META = {
  available: { label: "Disponibile", color: G.accent },
  reserved:  { label: "In sospeso",  color: G.amber  },
  sold:      { label: "Venduto",     color: "rgba(255,255,255,.3)" },
  archived:  { label: "Archiviato",  color: "rgba(255,255,255,.2)" },
};

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function daysSince(d: string | null) {
  if (!d) return 0;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

export default function StockClient({ initialItems, photoMap, profileMap, profiles }: Props) {
  const [filterStatus, setFilterStatus] = useState("available");
  const [search, setSearch]             = useState("");
  const [sellTarget, setSellTarget]     = useState<StockItem | null>(null);
  const [editTarget, setEditTarget]     = useState<StockItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isPending, startTransition]    = useTransition();
  const [actionId, setActionId]         = useState<string | null>(null);
  const [filterProfile, setFilterProfile] = useState("");

  const profileFiltered = useMemo(() => {
    if (!filterProfile) return initialItems;
    const profileName = profiles.find(p => p.id === filterProfile)?.name ?? "";
    return initialItems.filter(i =>
      i.profile_id === filterProfile || i.profile_id === profileName
    );
  }, [initialItems, filterProfile, profiles]);

  const items = useMemo(() => {
    let list = profileFiltered;
    if (filterStatus !== "all") list = list.filter(i => i.status === filterStatus);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i =>
        (i.name ?? "").toLowerCase().includes(q) ||
        (i.profile_id ? (profileMap[i.profile_id] ?? i.profile_id) : "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [profileFiltered, filterStatus, search, profileMap]);

  const available = profileFiltered.filter(i => i.status === "available");
  const reserved  = profileFiltered.filter(i => i.status === "reserved");
  const totalCost = available.reduce((s, i) => s + Number(i.purchase_price ?? 0) * Number(i.quantity ?? 1), 0);
  const stale     = available.filter(i => daysSince(i.purchased_at) > 60).length;

  function handleDelete(id: string) {
    setConfirmDelete(null); setActionId(id);
    startTransition(async () => { await deleteStockItem(id); setActionId(null); });
  }

  const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 90,
    background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "flex-end",
  };
  const sheetStyle: React.CSSProperties = {
    background: "rgba(8,10,20,.95)", border: "1px solid rgba(255,77,109,.2)",
    borderRadius: "20px 20px 0 0", backdropFilter: "blur(40px)",
    padding: "20px 18px 32px", width: "100%", maxWidth: 560, margin: "0 auto",
  };

  return (
    <>
      {sellTarget && <SellModal item={sellTarget} thumb={sellTarget.template_id_ext ? (photoMap[sellTarget.template_id_ext] ?? null) : null} onClose={() => setSellTarget(null)} />}
      {editTarget && <StockEditModal item={editTarget} thumb={editTarget.template_id_ext ? (photoMap[editTarget.template_id_ext] ?? null) : null} onClose={() => setEditTarget(null)} profiles={profiles} />}

      {confirmDelete && (
        <div style={overlayStyle} onClick={() => setConfirmDelete(null)}>
          <div style={sheetStyle} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: "rgba(255,255,255,.15)", borderRadius: 2, margin: "0 auto 20px" }} />
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Elimina articolo?</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 24 }}>L&apos;articolo verrà rimosso dal magazzino.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: "13px", borderRadius: 12, border: `1px solid ${G.border}`, background: G.glass, color: "rgba(255,255,255,.6)", cursor: "pointer", fontSize: 14 }}>Annulla</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ flex: 1, padding: "13px", borderRadius: 12, border: "1px solid rgba(255,77,109,.3)", background: "rgba(255,77,109,.1)", color: G.danger, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>Elimina</button>
            </div>
          </div>
        </div>
      )}

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Disponibili", value: String(available.reduce((s, i) => s + Number(i.quantity ?? 1), 0)), color: G.accent, glow: "rgba(0,229,195,.2)" },
          { label: "In sospeso",  value: String(reserved.length), color: G.amber, glow: "rgba(245,158,11,.2)" },
          { label: "Costo tot.",  value: `€${fmt(totalCost)}`, color: G.danger, glow: "rgba(255,77,109,.2)" },
          { label: ">60gg",       value: String(stale), color: G.amber, glow: "rgba(245,158,11,.2)" },
        ].map(k => (
          <div key={k.label} style={{
            background: G.glass, border: `1px solid ${G.border}`,
            borderBottom: `2px solid ${k.color}`,
            backdropFilter: G.blur, borderRadius: 12,
            padding: "12px 10px", position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: `linear-gradient(to top, ${k.glow}, transparent)`, pointerEvents: "none" }} />
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700, marginBottom: 5 }}>{k.label}</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: k.color, letterSpacing: "-.02em", wordBreak: "break-all" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filtri */}
      <div style={{ display: "flex", gap: 3, marginBottom: 10, background: "rgba(255,255,255,.03)", borderRadius: 12, padding: 3 }}>
        {([["available", "Disponibili"], ["reserved", "Sospeso"], ["sold", "Venduti"], ["all", "Tutti"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilterStatus(k)} style={{
            flex: 1, padding: "8px 2px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: filterStatus === k ? `1px solid rgba(0,229,195,.25)` : "1px solid transparent",
            background: filterStatus === k ? "rgba(0,229,195,.10)" : "transparent",
            backdropFilter: filterStatus === k ? G.blur : "none",
            color: filterStatus === k ? G.accent : "rgba(255,255,255,.4)",
            transition: "all .15s",
          }}>{l}</button>
        ))}
      </div>

      {/* Cerca + Profilo */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca articolo..."
            style={{
              width: "100%", padding: "11px 14px", borderRadius: 12,
              border: `1px solid ${G.border}`, background: G.glass,
              backdropFilter: G.blur, color: "rgba(255,255,255,.85)",
              fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
            }} />
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "rgba(255,255,255,.2)" }}>{items.length}/{initialItems.length}</span>
        </div>
        <select value={filterProfile} onChange={e => setFilterProfile(e.target.value)} style={{
          padding: "11px 12px", borderRadius: 12, flexShrink: 0,
          border: filterProfile ? `1px solid rgba(0,229,195,.3)` : `1px solid ${G.border}`,
          background: filterProfile ? "rgba(0,229,195,.08)" : G.glass,
          backdropFilter: G.blur, color: filterProfile ? G.accent : "rgba(255,255,255,.55)",
          fontSize: 13, outline: "none", fontFamily: "inherit",
          colorScheme: "dark", cursor: "pointer",
        }}>
          <option value="">Tutti i profili</option>
          {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(255,255,255,.25)", fontSize: 14 }}>Nessun articolo</div>}
        {items.map(item => {
          const st    = STATUS_META[item.status as keyof typeof STATUS_META] ?? STATUS_META.available;
          const thumb = item.template_id_ext ? photoMap[item.template_id_ext] : null;
          const days  = daysSince(item.purchased_at);
          const isStale = days > 60;
          const busy  = isPending && actionId === item.id;
          const profileName = item.profile_id ? (profileMap[item.profile_id] ?? item.profile_id) : null;

          return (
            <div key={item.id} style={{
              background: G.glass, border: `1px solid ${G.border}`,
              backdropFilter: G.blur, borderRadius: 14,
              display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
              opacity: busy ? .5 : 1, transition: "all .2s",
            }}>
              <div style={{ width: 52, height: 52, borderRadius: 11, overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,.05)", border: `1px solid ${G.border}` }}>
                {thumb
                  ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, opacity: .25 }}>📦</div>}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{item.name || "—"}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 4 }}>
                  {item.size && <span>T. {item.size}</span>}
                  {item.purchased_at && <span>· {new Date(item.purchased_at).toLocaleDateString("it")}</span>}
                  {profileName && <span>· {profileName}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: st.color, fontWeight: 700 }}>{st.label}</span>
                  {isStale && <span style={{ fontSize: 10, color: G.amber, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)" }}>⚠ {days}gg</span>}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-.02em" }}>€{fmt(Number(item.purchase_price ?? 0))}</div>
                {item.status === "available" && (
                  <button onClick={() => setSellTarget(item)} style={{
                    padding: "6px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer",
                    border: `1px solid rgba(0,229,195,.3)`, background: "rgba(0,229,195,.10)",
                    backdropFilter: G.blur, color: G.accent, whiteSpace: "nowrap",
                    boxShadow: "0 0 12px rgba(0,229,195,.08)",
                  }}>Vendi</button>
                )}
                {item.status === "reserved" && (
                  <span style={{ fontSize: 11, color: G.amber, fontWeight: 700, padding: "5px 10px", borderRadius: 8, background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)" }}>Sospeso</span>
                )}
                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={() => setEditTarget(item)} style={{ padding: "5px 9px", borderRadius: 8, border: `1px solid ${G.border}`, background: G.glass, backdropFilter: G.blur, color: "rgba(255,255,255,.6)", cursor: "pointer", fontSize: 13 }}>✏️</button>
                  <button onClick={() => setConfirmDelete(item.id)} style={{ padding: "5px 9px", borderRadius: 8, border: "1px solid rgba(255,77,109,.2)", background: "transparent", color: G.danger, cursor: "pointer", fontSize: 13 }}>🗑</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ height: 24 }} />
    </>
  );
}
