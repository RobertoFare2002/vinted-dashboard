// src/components/StockClient.tsx
"use client";

import { useState, useTransition, useMemo } from "react";
import dynamic from "next/dynamic";
import { deleteStockItem } from "@/app/(dashboard)/stock/actions";

const SellModal = dynamic(() => import("./SellModal"), { ssr: false });

type StockItem = {
  id:             string;
  name:           string | null;
  size:           string | null;
  quantity:       number | null;
  purchase_price: number | null;
  status:         string | null;
  purchased_at:   string | null;
  profile_id:     string | null;
  template_id_ext: string | null;
  location:       string | null;
};

type Props = {
  initialItems: StockItem[];
  photoMap:     Record<string, string>;
  profileMap:   Record<string, string>;
};

const STATUS_LABELS: Record<string, string> = {
  available: "Disponibile",
  reserved:  "In sospeso",
  sold:      "Venduto",
  archived:  "Archiviato",
};

const STATUS_COLORS: Record<string, string> = {
  available: "#16c2a3",
  reserved:  "#f59e0b",
  sold:      "rgba(255,255,255,.3)",
  archived:  "rgba(255,255,255,.2)",
};

export default function StockClient({ initialItems, photoMap, profileMap }: Props) {
  const [sellTarget, setSellTarget] = useState<StockItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("available");
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);

  const nowTs = Date.now();

  const items = useMemo(() => {
    let list = initialItems;
    if (filterStatus !== "all") list = list.filter(i => i.status === filterStatus);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i =>
        (i.name ?? "").toLowerCase().includes(q) ||
        (i.profile_id ?? "").toLowerCase().includes(q) ||
        (i.size ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [initialItems, filterStatus, search]);

  // KPI su tutti gli articoli (non filtrati)
  const available  = initialItems.filter(i => i.status === "available");
  const reserved   = initialItems.filter(i => i.status === "reserved");
  const totalItems = available.reduce((s, i) => s + Number(i.quantity ?? 1), 0);
  const totalCost  = available.reduce((s, i) => s + (Number(i.purchase_price ?? 0) * Number(i.quantity ?? 1)), 0);
  const stale      = available.filter(i => {
    if (!i.purchased_at) return false;
    return Math.floor((nowTs - new Date(i.purchased_at).getTime()) / 86400000) > 60;
  }).length;

  // KPI cards
  const kpiItems = [
    { label: "Disponibili",  value: String(totalItems),                color: "#16c2a3" },
    { label: "In sospeso",   value: String(reserved.length),           color: "#f59e0b" },
    { label: "Costo totale", value: `€ ${totalCost.toFixed(2)}`,       color: "#ff4d6d" },
    { label: "Fermi >60gg",  value: String(stale),                     color: "#f59e0b" },
  ];

  function handleDelete(id: string) {
    setConfirmDelete(null);
    setActionId(id);
    startTransition(async () => {
      await deleteStockItem(id);
      setActionId(null);
    });
  }

  return (
    <>
      {/* Modal vendita */}
      {sellTarget && (
        <SellModal
          item={sellTarget}
          thumb={sellTarget.template_id_ext ? (photoMap[sellTarget.template_id_ext] ?? null) : null}
          onClose={() => setSellTarget(null)}
        />
      )}

      {/* Conferma eliminazione */}
      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 90,
          background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }} onClick={() => setConfirmDelete(null)}>
          <div style={{
            background: "#121216", border: "1px solid rgba(255,77,109,.25)",
            borderRadius: 16, padding: "28px 24px", maxWidth: 360, width: "100%",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Elimina articolo?</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginBottom: 24 }}>
              L&apos;articolo verrà rimosso definitivamente dal magazzino.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{
                flex: 1, padding: "9px", borderRadius: 9,
                border: "1px solid rgba(255,255,255,.10)", background: "transparent",
                color: "rgba(255,255,255,.55)", cursor: "pointer", fontSize: 13
              }}>Annulla</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{
                flex: 1, padding: "9px", borderRadius: 9,
                border: "1px solid rgba(255,77,109,.4)",
                background: "rgba(255,77,109,.12)", color: "#ff4d6d",
                cursor: "pointer", fontWeight: 650, fontSize: 13
              }}>Elimina</button>
            </div>
          </div>
        </div>
      )}

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {kpiItems.map(({ label, value, color }) => (
          <div key={label} style={{
            background: "rgba(18,18,22,.9)", border: "1px solid rgba(255,255,255,.10)",
            borderRadius: 14, padding: "14px 12px"
          }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.55)", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {/* Filtro status */}
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,.04)", borderRadius: 10, padding: 3 }}>
          {([
            { key: "available", label: "Disponibili" },
            { key: "reserved",  label: "In sospeso"  },
            { key: "sold",      label: "Venduti"      },
            { key: "all",       label: "Tutti"        },
          ]).map(({ key, label }) => (
            <button key={key} onClick={() => setFilterStatus(key)} style={{
              padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: filterStatus === key ? "1px solid rgba(22,194,163,.3)" : "1px solid transparent",
              background: filterStatus === key ? "rgba(22,194,163,.12)" : "transparent",
              color: filterStatus === key ? "#16c2a3" : "rgba(255,255,255,.45)",
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Ricerca */}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca articolo, profilo…"
          style={{
            flex: 1, minWidth: 160, padding: "8px 12px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.05)",
            color: "rgba(255,255,255,.85)", fontSize: 13, fontFamily: "inherit", outline: "none"
          }}
        />

        {items.length !== initialItems.length && (
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.35)", whiteSpace: "nowrap" }}>
            {items.length} di {initialItems.length}
          </span>
        )}
      </div>

      {/* Lista */}
      <div style={{
        background: "rgba(18,18,22,.9)", border: "1px solid rgba(255,255,255,.10)",
        borderRadius: 14, overflow: "hidden"
      }}>

        {/* MOBILE */}
        <div className="stock-mobile-list">
          {items.length === 0 ? (
            <div style={{ padding: "48px 16px", textAlign: "center", color: "rgba(255,255,255,.35)" }}>
              {search || filterStatus !== "all" ? "Nessun risultato" : "Nessun articolo"}
            </div>
          ) : items.map((item, i) => {
            const days    = item.purchased_at ? Math.floor((nowTs - new Date(item.purchased_at).getTime()) / 86400000) : null;
            const isStale = days !== null && days > 60 && item.status === "available";
            const thumb   = item.template_id_ext ? (photoMap[item.template_id_ext] ?? null) : null;
            const busy    = isPending && actionId === item.id;
            const isSold  = item.status === "sold";

            return (
              <div key={item.id} style={{
                padding: "14px 16px",
                borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none",
                display: "flex", alignItems: "center", gap: 12,
                background: isStale ? "rgba(245,158,11,.03)" : "transparent",
                opacity: busy || isSold ? 0.6 : 1, transition: "opacity .2s"
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                  background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)",
                  overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {thumb ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 20, opacity: .3 }}>📷</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.name || "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>
                    {item.size ? `T. ${item.size}` : ""}
                    {item.size && item.purchased_at ? " · " : ""}
                    {item.purchased_at ? new Date(item.purchased_at).toLocaleDateString("it") : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {item.purchase_price != null ? `€${Number(item.purchase_price).toFixed(2)}` : "—"}
                  </div>
                  {item.status === "available" && (
                    <button onClick={() => setSellTarget(item)} style={{
                      padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      border: "1px solid rgba(22,194,163,.4)", background: "rgba(22,194,163,.12)", color: "#16c2a3",
                    }}>
                      Vendi
                    </button>
                  )}
                  {item.status === "reserved" && (
                    <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: "rgba(245,158,11,.12)", border: "1px solid rgba(245,158,11,.3)" }}>
                      In sospeso
                    </span>
                  )}
                  {item.status === "sold" && (
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)", fontWeight: 600 }}>Venduto</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* DESKTOP */}
        <div className="stock-desktop-table" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.03)" }}>
                {["Data acq.", "Prodotto", "Taglia", "Qtà", "Costo acq.", "Giorni", "Stato", ""].map(h => (
                  <th key={h} style={{
                    padding: "11px 16px", textAlign: "left",
                    color: "rgba(255,255,255,.4)", fontWeight: 500, fontSize: 11,
                    whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: ".05em"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "48px 16px", textAlign: "center", color: "rgba(255,255,255,.35)" }}>
                  {search || filterStatus !== "all" ? "Nessun risultato" : "Nessun articolo"}
                </td></tr>
              ) : items.map((item, i) => {
                const days    = item.purchased_at ? Math.floor((nowTs - new Date(item.purchased_at).getTime()) / 86400000) : null;
                const isStale = days !== null && days > 60 && item.status === "available";
                const thumb   = item.template_id_ext ? (photoMap[item.template_id_ext] ?? null) : null;
                const busy    = isPending && actionId === item.id;
                const isSold  = item.status === "sold";
                const statusColor = STATUS_COLORS[item.status ?? "available"] ?? "rgba(255,255,255,.3)";

                return (
                  <tr key={item.id} style={{
                    borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none",
                    background: isStale ? "rgba(245,158,11,.03)" : "transparent",
                    opacity: busy ? 0.45 : 1, transition: "opacity .2s"
                  }}>
                    <td style={{ padding: "13px 16px", color: "rgba(255,255,255,.45)", whiteSpace: "nowrap", fontSize: 12 }}>
                      {item.purchased_at ? new Date(item.purchased_at).toLocaleDateString("it") : "—"}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 8, flexShrink: 0,
                          background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)",
                          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          {thumb ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <span style={{ fontSize: 16, opacity: .3 }}>📷</span>}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name || "—"}</div>
                          {item.profile_id && <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 1 }}>{profileMap[item.profile_id] ?? item.profile_id}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px", color: "rgba(255,255,255,.55)" }}>{item.size || "—"}</td>
                    <td style={{ padding: "13px 16px", color: "rgba(255,255,255,.7)", fontWeight: 600 }}>{item.quantity ?? 1}</td>
                    <td style={{ padding: "13px 16px", color: "rgba(255,255,255,.7)" }}>
                      {item.purchase_price != null ? `€ ${Number(item.purchase_price).toFixed(2)}` : "—"}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      {days !== null
                        ? <span style={{ color: isStale ? "#f59e0b" : "rgba(255,255,255,.45)", fontWeight: isStale ? 700 : 400 }}>
                            {isStale ? "⚠️ " : ""}{days}gg
                          </span>
                        : "—"}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: statusColor }}>
                        {STATUS_LABELS[item.status ?? "available"] ?? item.status}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {item.status === "available" && (
                          <button onClick={() => setSellTarget(item)} style={{
                            padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                            border: "1px solid rgba(22,194,163,.4)", background: "rgba(22,194,163,.12)", color: "#16c2a3",
                            whiteSpace: "nowrap"
                          }}>
                            Vendi
                          </button>
                        )}
                        {item.status === "reserved" && (
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 8,
                            color: "#f59e0b", background: "rgba(245,158,11,.12)", border: "1px solid rgba(245,158,11,.3)",
                            whiteSpace: "nowrap"
                          }}>
                            In sospeso
                          </span>
                        )}
                        <button onClick={() => setConfirmDelete(item.id)} style={{
                          padding: "5px 8px", borderRadius: 7,
                          border: "1px solid rgba(255,77,109,.2)", background: "transparent",
                          color: "#ff4d6d", cursor: "pointer", fontSize: 13, lineHeight: 1
                        }} title="Elimina">🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .stock-mobile-list   { display: block; }
        .stock-desktop-table { display: none; }
        @media (min-width: 768px) {
          .stock-mobile-list   { display: none; }
          .stock-desktop-table { display: block; }
        }
      `}</style>
    </>
  );
}
