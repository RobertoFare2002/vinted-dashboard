"use client";
// src/components/StockClient.tsx
import { useState, useMemo, useTransition } from "react";
import { deleteStockItem, bulkSellStockItems } from "@/app/(dashboard)/stock/actions";
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

const G      = "#007782";
const RED    = "#FF4D4D";
const AMB    = "#F5A623";
const INK    = "var(--ink)";
const SL     = "var(--slate)";
const BD     = "var(--border)";
const LT     = "var(--light)";
const W      = "var(--white)";
const VINTED = "#09B1BA";

const STATUS_META: Record<string, { label: string; dot: string; color: string; bg: string }> = {
  available: { label: "Disponibile", dot: "#6bb800", color: "#6bb800", bg: "#f0fad0" },
  reserved:  { label: "In sospeso",  dot: AMB,       color: AMB,       bg: "#fef3c7" },
  sold:      { label: "Venduto",     dot: SL,        color: SL,        bg: LT },
  archived:  { label: "Archiviato",  dot: SL,        color: SL,        bg: LT },
};

function fmt(n: number) { return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function daysSince(d: string | null) { if (!d) return 0; return Math.floor((Date.now() - new Date(d).getTime()) / 86400000); }

// ── Bundle Modal ──────────────────────────────────────────────────────────────
type BundleItem = StockItem & { bundlePrice: string };

function BundleModal({
  availableItems, photoMap, profileMap, profiles, onClose,
}: {
  availableItems: StockItem[];
  photoMap: Record<string, string>;
  profileMap: Record<string, string>;
  profiles: Profile[];
  onClose: () => void;
}) {
  const [step, setStep] = useState<"select" | "prices">("select");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const [search, setSearch] = useState("");
  const [buyer, setBuyer] = useState("");
  const [platform, setPlatform] = useState("vinted");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = availableItems.filter(i =>
    !search.trim() ||
    (i.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (i.profile_id ? (profileMap[i.profile_id] ?? "") : "").toLowerCase().includes(search.toLowerCase())
  );

  function toggleItem(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function goToPrices() {
    if (selected.size < 2) { setError("Seleziona almeno 2 articoli per creare un bundle."); return; }
    setError(null);
    const items = availableItems
      .filter(i => selected.has(i.id))
      .map(i => ({ ...i, bundlePrice: "" }));
    setBundleItems(items);
    setStep("prices");
  }

  function updatePrice(id: string, val: string) {
    setBundleItems(prev => prev.map(i => i.id === id ? { ...i, bundlePrice: val } : i));
  }

  const totalBundle = bundleItems.reduce((s, i) => s + (parseFloat(i.bundlePrice) || 0), 0);
  const totalCost   = bundleItems.reduce((s, i) => s + Number(i.purchase_price ?? 0), 0);

  function handleSubmit() {
    setError(null);
    for (const i of bundleItems) {
      if (!parseFloat(i.bundlePrice) || parseFloat(i.bundlePrice) <= 0) {
        setError(`Inserisci un prezzo valido per "${i.name ?? "Articolo"}".`);
        return;
      }
    }
    startTransition(async () => {
      try {
        await bulkSellStockItems({
          items: bundleItems.map(i => ({
            stockId:       i.id,
            stockName:     i.name ?? "Articolo",
            purchasePrice: Number(i.purchase_price ?? 0),
            externalId:    i.template_id_ext ?? "",
            profileId:     i.profile_id ?? null,
            salePrice:     parseFloat(i.bundlePrice),
          })),
          saleDate,
          platform,
          notes,
          profileId: null,
        });
        onClose();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Errore sconosciuto");
      }
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 13px", borderRadius: 12,
    border: `1px solid ${BD}`, background: LT,
    color: INK, fontSize: 13, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, color: SL,
    marginBottom: 5, fontWeight: 600,
    textTransform: "uppercase", letterSpacing: ".05em",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.45)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: W, borderRadius: 24, width: "100%", maxWidth: 520, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,.20)", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "22px 24px 16px", borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: G, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: INK, letterSpacing: "-.02em" }}>Crea Bundle</div>
                <div style={{ fontSize: 11, color: SL }}>
                  {step === "select"
                    ? `${selected.size} articoli selezionati`
                    : `${bundleItems.length} articoli · totale €${fmt(totalBundle)}`}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: LT, cursor: "pointer", color: SL, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>✕</button>
          </div>
          {/* Progress bar */}
          <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: VINTED }} />
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: step === "prices" ? VINTED : BD, transition: "background .2s" }} />
          </div>
        </div>

        {/* STEP 1: Seleziona */}
        {step === "select" && (
          <>
            <div style={{ padding: "14px 24px 0", flexShrink: 0 }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cerca articolo…"
                style={{ ...inputStyle, marginBottom: 4 }}
              />
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.length === 0 && (
                  <div style={{ textAlign: "center", padding: "32px 0", color: SL, fontSize: 14 }}>Nessun articolo disponibile</div>
                )}
                {filtered.map(item => {
                  const isSelected = selected.has(item.id);
                  const thumb = item.template_id_ext ? photoMap[item.template_id_ext] : null;
                  const profileName = item.profile_id ? (profileMap[item.profile_id] ?? null) : null;
                  const days = daysSince(item.purchased_at);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "11px 14px", borderRadius: 14, cursor: "pointer",
                        border: isSelected ? `2px solid ${VINTED}` : `2px solid ${BD}`,
                        background: isSelected ? `${VINTED}10` : W,
                        transition: "all .15s",
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: 6,
                        border: isSelected ? `2px solid ${VINTED}` : `2px solid ${BD}`,
                        background: isSelected ? VINTED : W,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, transition: "all .15s",
                      }}>
                        {isSelected && <span style={{ color: W, fontSize: 11, fontWeight: 800 }}>✓</span>}
                      </div>
                      <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: LT }}>
                        {thumb
                          ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name ?? "—"}</div>
                        <div style={{ fontSize: 11, color: SL, marginTop: 2, display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {item.size && <span>T. {item.size}</span>}
                          {profileName && <span>· {profileName}</span>}
                          {days > 60 && <span style={{ color: AMB }}>· ⚠ {days}gg</span>}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: INK, flexShrink: 0 }}>€{fmt(Number(item.purchase_price ?? 0))}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${BD}`, flexShrink: 0, background: W }}>
              {error && <div style={{ fontSize: 12, color: RED, background: `${RED}08`, padding: "8px 12px", borderRadius: 10, marginBottom: 10 }}>⚠ {error}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 999, border: `1px solid ${BD}`, background: W, color: SL, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>Annulla</button>
                <button
                  onClick={goToPrices}
                  style={{ flex: 2, padding: "11px", borderRadius: 999, border: "none", background: selected.size >= 2 ? G : BD, color: selected.size >= 2 ? W : SL, cursor: selected.size >= 2 ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 700, fontFamily: "inherit", transition: "all .15s" }}
                >
                  Avanti → Prezzi ({selected.size})
                </button>
              </div>
            </div>
          </>
        )}

        {/* STEP 2: Prezzi */}
        {step === "prices" && (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: SL, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
                Prezzo di vendita per articolo
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {bundleItems.map(item => {
                  const thumb = item.template_id_ext ? photoMap[item.template_id_ext] : null;
                  const cost = Number(item.purchase_price ?? 0);
                  const price = parseFloat(item.bundlePrice) || 0;
                  const margin = cost > 0 && price > 0 ? Math.round(((price - cost) / cost) * 100) : null;
                  return (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: LT, border: `1px solid ${BD}` }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: W }}>
                        {thumb
                          ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{item.name ?? "—"}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11, color: SL }}>Costo: €{fmt(cost)}</span>
                          {margin !== null && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: margin >= 0 ? "#6bb800" : RED, background: margin >= 0 ? "#f0fad0" : `${RED}12`, padding: "2px 7px", borderRadius: 6 }}>
                              {margin >= 0 ? "+" : ""}{margin}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: SL }}>€</span>
                        <input
                          type="number" step="0.01" min="0"
                          value={item.bundlePrice}
                          onChange={e => updatePrice(item.id, e.target.value)}
                          placeholder="0.00"
                          style={{ width: 82, padding: "7px 10px", borderRadius: 10, border: `1px solid ${BD}`, background: W, color: INK, fontSize: 14, fontWeight: 700, fontFamily: "inherit", outline: "none", textAlign: "right" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totale */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: 14, background: `${VINTED}10`, border: `1px solid ${VINTED}35`, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: VINTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Totale Bundle</div>
                  <div style={{ fontSize: 11, color: SL, marginTop: 2 }}>Costo totale: €{fmt(totalCost)} · Margine: {totalCost > 0 ? `${Math.round(((totalBundle - totalCost) / totalCost) * 100)}%` : "—"}</div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: INK, letterSpacing: "-.03em" }}>€{fmt(totalBundle)}</div>
              </div>

              {/* Dati vendita */}
              <div style={{ fontSize: 11, fontWeight: 700, color: SL, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>Dati vendita</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 14px", marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>Data vendita</label>
                  <input style={inputStyle} type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Piattaforma</label>
                  <select style={inputStyle} value={platform} onChange={e => setPlatform(e.target.value)}>
                    <option value="vinted">Vinted</option>
                    <option value="depop">Depop</option>
                    <option value="ebay">eBay</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Acquirente (opzionale)</label>
                <input style={inputStyle} value={buyer} onChange={e => setBuyer(e.target.value)} placeholder="Nome utente…" />
              </div>
              <div>
                <label style={labelStyle}>Note (opzionale)</label>
                <textarea style={{ ...inputStyle, minHeight: 52, resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Dettagli ordine, spedizione…" />
              </div>
            </div>

            <div style={{ padding: "16px 24px", borderTop: `1px solid ${BD}`, flexShrink: 0, background: W }}>
              {error && <div style={{ fontSize: 12, color: RED, background: `${RED}08`, padding: "8px 12px", borderRadius: 10, marginBottom: 10 }}>⚠ {error}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setStep("select"); setError(null); }} style={{ flex: 1, padding: "11px", borderRadius: 999, border: `1px solid ${BD}`, background: W, color: SL, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>← Indietro</button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  style={{ flex: 2, padding: "11px", borderRadius: 999, border: "none", background: isPending ? BD : G, color: isPending ? SL : W, cursor: isPending ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", transition: "all .15s" }}
                >
                  {isPending ? "Registrazione…" : `✓ Registra Bundle · €${fmt(totalBundle)}`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main StockClient ──────────────────────────────────────────────────────────

export default function StockClient({ initialItems, photoMap, profileMap, profiles }: Props) {
  const [search, setSearch]               = useState("");
  const [sellTarget, setSellTarget]       = useState<StockItem | null>(null);
  const [editTarget, setEditTarget]       = useState<StockItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showBundle, setShowBundle]       = useState(false);
  const [isPending, startTransition]      = useTransition();
  const [actionId, setActionId]           = useState<string | null>(null);

  const available = initialItems.filter(i => i.status === "available");
  const reserved  = initialItems.filter(i => i.status === "reserved");
  const totalCost = available.reduce((s, i) => s + Number(i.purchase_price ?? 0) * Number(i.quantity ?? 1), 0);
  const stale     = available.filter(i => daysSince(i.purchased_at) > 60).length;

  const items = useMemo(() => {
    let list = available;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i =>
        (i.name ?? "").toLowerCase().includes(q) ||
        (i.profile_id ? (profileMap[i.profile_id] ?? i.profile_id) : "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [initialItems, search, profileMap]);

  function handleDelete(id: string) { setConfirmDelete(null); setActionId(id); startTransition(async () => { await deleteStockItem(id); setActionId(null); }); }

  return (
    <>
      {sellTarget && <SellModal item={sellTarget} thumb={sellTarget.template_id_ext ? (photoMap[sellTarget.template_id_ext] ?? null) : null} onClose={() => setSellTarget(null)} profiles={profiles} />}
      {editTarget && <StockEditModal item={editTarget} thumb={editTarget.template_id_ext ? (photoMap[editTarget.template_id_ext] ?? null) : null} onClose={() => setEditTarget(null)} profiles={profiles} />}
      {showBundle && (
        <BundleModal
          availableItems={available}
          photoMap={photoMap}
          profileMap={profileMap}
          profiles={profiles}
          onClose={() => setShowBundle(false)}
        />
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,.35)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setConfirmDelete(null)}>
          <div style={{ background: W, borderRadius: 20, padding: "24px 20px", maxWidth: 400, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,.14)" }} onClick={e => e.stopPropagation()}>
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
      <div className="kpi-grid-4">
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

      {/* Barra azioni */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ padding: "7px 16px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: INK, color: W }}>
            Disponibili
          </div>
          <span style={{ fontSize: 12, color: SL }}>{available.length} articoli</span>
        </div>

        <button
          onClick={() => setShowBundle(true)}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 18px", borderRadius: 999, border: "none",
            background: G, color: W,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Crea Bundle
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca articolo, profilo..."
          style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "none", background: W, color: INK, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}
        />
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: SL }}>{items.length}/{available.length}</span>
      </div>

      {/* Lista articoli */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: SL, fontSize: 14 }}>Nessun articolo disponibile</div>}
        {items.map(item => {
          const st    = STATUS_META[item.status as keyof typeof STATUS_META] ?? STATUS_META.available;
          const thumb = item.template_id_ext ? photoMap[item.template_id_ext] : null;
          const days  = daysSince(item.purchased_at);
          const isStale = days > 60;
          const busy  = isPending && actionId === item.id;
          const profileName = item.profile_id ? (profileMap[item.profile_id] ?? item.profile_id) : null;

          return (
            <div key={item.id} className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", opacity: busy ? .5 : 1, transition: "all .2s" }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: LT }}>
                {thumb
                  ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4, color: INK }}>{item.name || "—"}</div>
                <div style={{ fontSize: 11, color: SL, display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 5 }}>
                  {item.size && <span>T. {item.size}</span>}
                  {item.purchased_at && <span>· {new Date(item.purchased_at).toLocaleDateString("it")}</span>}
                  {profileName && <span>· {profileName}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: st.color }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, display: "inline-block" }} />
                    {st.label}
                  </span>
                  {isStale && <span style={{ fontSize: 10, color: AMB, fontWeight: 700 }}>⚠ {days}gg</span>}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-.02em", color: INK, fontVariantNumeric: "tabular-nums" }}>€{fmt(Number(item.purchase_price ?? 0))}</div>
                <button onClick={() => setSellTarget(item)} style={{ background: G, color: W, padding: "6px 16px", fontSize: 12, fontWeight: 700, borderRadius: 999, border: "none", cursor: "pointer", fontFamily: "inherit" }}>Vendi</button>
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
