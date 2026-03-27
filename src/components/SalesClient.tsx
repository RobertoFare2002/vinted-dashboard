// src/components/SalesClient.tsx
"use client";

import { useState, useTransition, useMemo } from "react";
import dynamic from "next/dynamic";
import { deleteSale, changeSaleStatus } from "@/app/(dashboard)/sales/actions";
import { cancelSale, concludeSale } from "@/app/(dashboard)/stock/actions";

const SaleModal = dynamic(() => import("./SaleModal"), { ssr: false });

// ── Tipi ─────────────────────────────────────────────────────────────────────

type SaleRow = {
  id:               string;
  buyer_seller:     string | null;
  amount:           number | null;
  cost:             number | null;
  platform:         string | null;
  status:           string | null;
  notes:            string | null;
  transaction_date: string | null;
  template_id_ext:  string | null;
  profile_id:       string | null;
  raw_data:         { stock_id?: string } | null;
};

type Template = { id: string; name: string };

type Props = {
  initialSales: SaleRow[];
  templates:    Template[];
  photoMap:     Record<string, string>;
};

// ── Costanti ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  open:   { label: "In sospeso", color: "#f59e0b", bg: "rgba(245,158,11,.12)", border: "rgba(245,158,11,.3)" },
  closed: { label: "Conclusa",   color: "#16c2a3", bg: "rgba(22,194,163,.12)", border: "rgba(22,194,163,.3)" },
};

const PLATFORM_LABELS: Record<string, string> = {
  vinted: "Vinted", depop: "Depop", ebay: "eBay", altro: "Altro",
};

// ── Componente principale ─────────────────────────────────────────────────────

export default function SalesClient({ initialSales, templates, photoMap }: Props) {
  const [modal, setModal] = useState<{ mode: "add" | "edit"; sale?: SaleRow } | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<{ saleId: string; stockId: string } | null>(null);

  // Filtraggio lato client (istantaneo, senza round-trip)
  const sales = useMemo(() => {
    let list = initialSales;
    if (filter !== "all") list = list.filter(s => s.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s =>
        (s.buyer_seller ?? "").toLowerCase().includes(q) ||
        (s.notes ?? "").toLowerCase().includes(q) ||
        (s.profile_id ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [initialSales, filter, search]);

  // KPI calcolati sulla lista filtrata (o su tutta per i totali)
  const closed       = initialSales.filter(s => s.status === "closed");
  const totalRevenue = closed.reduce((s, r) => s + Number(r.amount ?? 0), 0);
  const totalCost    = initialSales.reduce((s, r) => s + Number(r.cost   ?? 0), 0);
  const profit       = totalRevenue - totalCost;
  const pending      = initialSales.filter(s => s.status === "open").length;

  const kpiItems = [
    { label: "Ricavi conclusi", value: `€ ${totalRevenue.toFixed(2)}`, color: "#16c2a3" },
    { label: "Costi totali",    value: `€ ${totalCost.toFixed(2)}`,    color: "#ff4d6d" },
    { label: "Profitto netto",  value: `€ ${profit.toFixed(2)}`,       color: profit >= 0 ? "#16c2a3" : "#ff4d6d" },
    { label: "In sospeso",      value: String(pending),                 color: "#f59e0b" },
  ];

  // ── Azioni ────────────────────────────────────────────────────────────────

  function handleDelete(id: string) {
    setConfirmDelete(null);
    setActionId(id);
    startTransition(async () => {
      await deleteSale(id);
      setActionId(null);
    });
  }

  function handleToggleStatus(sale: SaleRow) {
    const next = sale.status === "open" ? "closed" : "open";
    setActionId(sale.id);
    startTransition(async () => {
      await changeSaleStatus(sale.id, next as "open" | "closed");
      setActionId(null);
    });
  }

  function handleCancel(saleId: string, stockId: string) {
    setConfirmCancel(null);
    setActionId(saleId);
    startTransition(async () => {
      await cancelSale({ saleId, stockId });
      setActionId(null);
    });
  }

  function handleConclude(saleId: string, stockId: string) {
    setActionId(saleId);
    startTransition(async () => {
      await concludeSale({ saleId, stockId });
      setActionId(null);
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Modale add/edit */}
      {modal && (
        <SaleModal
          mode={modal.mode}
          sale={modal.sale}
          templates={templates}
          onClose={() => setModal(null)}
        />
      )}

      {/* Modale conferma eliminazione */}
      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 90,
          background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }} onClick={() => setConfirmDelete(null)}>
          <div style={{
            background: "#121216", border: "1px solid rgba(255,77,109,.25)",
            borderRadius: 16, padding: "28px 24px", maxWidth: 360, width: "100%",
            boxShadow: "0 32px 80px rgba(0,0,0,.6)"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Elimina vendita?</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginBottom: 24 }}>
              Questa operazione non può essere annullata.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{
                flex: 1, padding: "9px", borderRadius: 9, border: "1px solid rgba(255,255,255,.10)",
                background: "transparent", color: "rgba(255,255,255,.55)", cursor: "pointer", fontSize: 13
              }}>Annulla</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{
                flex: 1, padding: "9px", borderRadius: 9, border: "1px solid rgba(255,77,109,.4)",
                background: "rgba(255,77,109,.12)", color: "#ff4d6d", cursor: "pointer", fontWeight: 650, fontSize: 13
              }}>Elimina</button>
            </div>
          </div>
        </div>
      )}

      {/* Modale conferma annullamento vendita + ripristino magazzino */}
      {confirmCancel && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 90,
          background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }} onClick={() => setConfirmCancel(null)}>
          <div style={{
            background: "#121216", border: "1px solid rgba(245,158,11,.25)",
            borderRadius: 16, padding: "28px 24px", maxWidth: 380, width: "100%",
            boxShadow: "0 32px 80px rgba(0,0,0,.6)"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>↩ Annulla vendita?</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginBottom: 6 }}>
              La vendita verrà eliminata e l&apos;articolo tornerà disponibile nel magazzino.
            </div>
            <div style={{
              fontSize: 12, color: "#f59e0b", marginBottom: 24,
              padding: "8px 12px", borderRadius: 8, background: "rgba(245,158,11,.08)",
              border: "1px solid rgba(245,158,11,.2)"
            }}>
              ⚠️ Questa operazione non può essere annullata.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmCancel(null)} style={{
                flex: 1, padding: "9px", borderRadius: 9, border: "1px solid rgba(255,255,255,.10)",
                background: "transparent", color: "rgba(255,255,255,.55)", cursor: "pointer", fontSize: 13
              }}>Mantieni</button>
              <button onClick={() => handleCancel(confirmCancel.saleId, confirmCancel.stockId)} style={{
                flex: 1, padding: "9px", borderRadius: 9, border: "1px solid rgba(245,158,11,.4)",
                background: "rgba(245,158,11,.12)", color: "#f59e0b",
                cursor: "pointer", fontWeight: 650, fontSize: 13
              }}>↩ Annulla vendita</button>
            </div>
          </div>
        </div>
      )}

      {/* KPI */}
      <div className="sales-kpi-grid" style={{ marginBottom: 20 }}>
        {kpiItems.map(({ label, value, color }) => (
          <div key={label} style={{
            background: "rgba(18,18,22,.9)", border: "1px solid rgba(255,255,255,.10)",
            borderRadius: 14, padding: "14px 16px"
          }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar: aggiungi + filtri + ricerca */}
      <div style={{
        display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center"
      }}>
        <button onClick={() => setModal({ mode: "add" })} style={{
          padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(22,194,163,.4)",
          background: "rgba(22,194,163,.12)", color: "#16c2a3", fontWeight: 650,
          fontSize: 13, cursor: "pointer", whiteSpace: "nowrap"
        }}>
          ➕ Nuova vendita
        </button>

        {/* Filtro stato */}
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,.04)", borderRadius: 10, padding: 3 }}>
          {(["all", "open", "closed"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 12px", borderRadius: 7, border: filter === f ? "1px solid rgba(22,194,163,.3)" : "1px solid transparent",
              background: filter === f ? "rgba(22,194,163,.12)" : "transparent",
              color: filter === f ? "#16c2a3" : "rgba(255,255,255,.45)",
              fontSize: 12, fontWeight: 600, cursor: "pointer"
            }}>
              {f === "all" ? "Tutti" : f === "open" ? "In sospeso" : "Concluse"}
            </button>
          ))}
        </div>

        {/* Ricerca */}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca prodotto, acquirente…"
          style={{
            flex: 1, minWidth: 160, padding: "8px 12px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.05)",
            color: "rgba(255,255,255,.85)", fontSize: 13, fontFamily: "inherit", outline: "none"
          }}
        />

        {sales.length !== initialSales.length && (
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.35)", whiteSpace: "nowrap" }}>
            {sales.length} di {initialSales.length}
          </span>
        )}
      </div>

      {/* Tabella / lista */}
      <div style={{
        background: "rgba(18,18,22,.9)", border: "1px solid rgba(255,255,255,.10)",
        borderRadius: 14, overflow: "hidden"
      }}>

        {/* MOBILE: card list */}
        <div className="mobile-list">
          {sales.length === 0 ? (
            <div style={{ padding: "48px 16px", textAlign: "center", color: "rgba(255,255,255,.35)" }}>
              {search || filter !== "all" ? "Nessun risultato per il filtro corrente" : "Nessuna vendita ancora"}
            </div>
          ) : sales.map((s, i) => {
            const meta   = STATUS_META[s.status ?? "open"] ?? STATUS_META.open;
            const amount = Number(s.amount ?? 0);
            const cost   = Number(s.cost   ?? 0);
            const diff   = amount - cost;
            const margin = cost > 0 ? Math.round((diff / cost) * 100) : null;
            const thumb  = s.template_id_ext ? (photoMap[s.template_id_ext] ?? null) : null;
            const busy   = isPending && actionId === s.id;

            return (
              <div key={s.id} style={{
                padding: "14px 16px",
                borderBottom: i < sales.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none",
                display: "flex", alignItems: "center", gap: 12,
                opacity: busy ? 0.5 : 1, transition: "opacity .2s"
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                  background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)",
                  overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {thumb
                    ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 20, opacity: .3 }}>📷</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.buyer_seller || "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>
                    {new Date(s.transaction_date!).toLocaleDateString("it")}
                    {s.platform ? ` · ${PLATFORM_LABELS[s.platform] ?? s.platform}` : ""}
                    {s.profile_id ? ` · ${s.profile_id}` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>€{amount.toFixed(2)}</div>
                  {margin !== null && (
                    <span style={{ fontSize: 11, color: margin >= 0 ? "#16c2a3" : "#ff4d6d", fontWeight: 600, display: "block", marginBottom: 3 }}>
                      {margin >= 0 ? "▲" : "▼"} {Math.abs(margin)}%
                    </span>
                  )}
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
                    {meta.label}
                  </span>
                </div>
                {/* Azioni mobile */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => setModal({ mode: "edit", sale: s })} style={actionBtnStyle} title="Modifica">✏️</button>
                  {s.raw_data?.stock_id && s.status === "open" && (
                    <button
                      onClick={() => handleConclude(s.id, s.raw_data!.stock_id!)}
                      style={{ ...actionBtnStyle, borderColor: "rgba(22,194,163,.3)", color: "#16c2a3" }}
                      title="Concludi vendita"
                    >✅</button>
                  )}
                  {s.raw_data?.stock_id && (
                    <button
                      onClick={() => setConfirmCancel({ saleId: s.id, stockId: s.raw_data!.stock_id! })}
                      style={{ ...actionBtnStyle, borderColor: "rgba(245,158,11,.3)", color: "#f59e0b" }}
                      title="Annulla vendita e ripristina magazzino"
                    >↩</button>
                  )}
                  <button onClick={() => setConfirmDelete(s.id)} style={{ ...actionBtnStyle, borderColor: "rgba(255,77,109,.25)", color: "#ff4d6d" }} title="Elimina">🗑</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* DESKTOP: tabella */}
        <div className="desktop-table" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.03)" }}>
                {["Data", "Prodotto", "Costo acq.", "Prezzo vend.", "Margine", "Stato", "Profilo", ""].map(h => (
                  <th key={h} style={{
                    padding: "11px 16px", textAlign: "left",
                    color: "rgba(255,255,255,.4)", fontWeight: 500, fontSize: 11,
                    whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: ".05em"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "48px 16px", textAlign: "center", color: "rgba(255,255,255,.35)" }}>
                  {search || filter !== "all" ? "Nessun risultato" : "Nessuna vendita ancora"}
                </td></tr>
              ) : sales.map((s, i) => {
                const meta   = STATUS_META[s.status ?? "open"] ?? STATUS_META.open;
                const amount = Number(s.amount ?? 0);
                const cost   = Number(s.cost   ?? 0);
                const diff   = amount - cost;
                const margin = cost > 0 ? Math.round((diff / cost) * 100) : null;
                const thumb  = s.template_id_ext ? (photoMap[s.template_id_ext] ?? null) : null;
                const busy   = isPending && actionId === s.id;

                return (
                  <tr key={s.id} style={{
                    borderBottom: i < sales.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none",
                    opacity: busy ? 0.45 : 1, transition: "opacity .2s",
                  }}>
                    <td style={{ padding: "13px 16px", color: "rgba(255,255,255,.45)", whiteSpace: "nowrap", fontSize: 12 }}>
                      {new Date(s.transaction_date!).toLocaleDateString("it")}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 7, flexShrink: 0,
                          background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)",
                          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          {thumb ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 16, opacity: .3 }}>📷</span>}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{s.buyer_seller || "—"}</div>
                          {s.platform && <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 1 }}>{PLATFORM_LABELS[s.platform] ?? s.platform}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px", color: "rgba(255,255,255,.6)" }}>
                      {cost > 0 ? `€ ${cost.toFixed(2)}` : "—"}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>€ {amount.toFixed(2)}</div>
                      {diff > 0 && <div style={{ fontSize: 11, color: "#16c2a3", marginTop: 1 }}>+€ {diff.toFixed(2)}</div>}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      {margin !== null
                        ? <span style={{ color: margin >= 0 ? "#16c2a3" : "#ff4d6d", fontWeight: 700 }}>{margin >= 0 ? "▲" : "▼"} {Math.abs(margin)}%</span>
                        : "—"}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      {/* Stato cliccabile → toggle */}
                      <button
                        onClick={() => handleToggleStatus(s)}
                        disabled={busy}
                        title="Clicca per cambiare stato"
                        style={{
                          fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8,
                          color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`,
                          cursor: "pointer", transition: "opacity .15s"
                        }}
                      >
                        {meta.label}
                      </button>
                    </td>
                    <td style={{ padding: "13px 16px", color: "rgba(255,255,255,.4)", fontSize: 12 }}>
                      {s.profile_id || "—"}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setModal({ mode: "edit", sale: s })} style={actionBtnStyle} title="Modifica">✏️</button>
                        {s.raw_data?.stock_id && s.status === "open" && (
                          <button
                            onClick={() => handleConclude(s.id, s.raw_data!.stock_id!)}
                            style={{ ...actionBtnStyle, borderColor: "rgba(22,194,163,.3)", color: "#16c2a3" }}
                            title="Concludi vendita → sposta in venduto"
                          >✅</button>
                        )}
                        {s.raw_data?.stock_id && (
                          <button
                            onClick={() => setConfirmCancel({ saleId: s.id, stockId: s.raw_data!.stock_id! })}
                            style={{ ...actionBtnStyle, borderColor: "rgba(245,158,11,.3)", color: "#f59e0b" }}
                            title="Annulla vendita e ripristina magazzino"
                          >↩</button>
                        )}
                        <button onClick={() => setConfirmDelete(s.id)} style={{ ...actionBtnStyle, borderColor: "rgba(255,77,109,.25)", color: "#ff4d6d" }} title="Elimina">🗑</button>
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
        .sales-kpi-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
        .mobile-list    { display: block; }
        .desktop-table  { display: none; }
        @media (min-width: 768px) {
          .sales-kpi-grid { grid-template-columns: repeat(4,1fr); gap: 16px; }
          .mobile-list    { display: none; }
          .desktop-table  { display: block; }
        }
      `}</style>
    </>
  );
}

const actionBtnStyle: React.CSSProperties = {
  padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(255,255,255,.10)",
  background: "rgba(255,255,255,.04)", cursor: "pointer", fontSize: 13,
  color: "rgba(255,255,255,.6)", lineHeight: 1, transition: "background .15s",
};
