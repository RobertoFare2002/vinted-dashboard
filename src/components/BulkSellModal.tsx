"use client";
// src/components/BulkSellModal.tsx
import { useState, useTransition } from "react";
import { bulkSellStockItems } from "@/app/(dashboard)/stock/actions";

type StockItem = {
  id: string; name: string|null; size: string|null; quantity: number|null;
  purchase_price: number|null; status: string|null; purchased_at: string|null;
  template_id_ext: string|null; profile_id: string|null;
  external_id: string|null; location: string|null;
};

type Props = {
  items:    StockItem[];
  photoMap: Record<string, string>;
  profiles: { id: string; name: string }[];
  onClose:  () => void;
};

const S = {
  overlay: {
    position: "fixed" as const, inset: 0, zIndex: 110,
    background: "rgba(0,0,0,.82)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "flex-end", justifyContent: "center",
  },
  sheet: {
    background: "#0f1520", border: "1px solid rgba(255,255,255,.1)",
    borderRadius: "20px 20px 0 0", padding: "20px 18px 32px",
    width: "100%", maxWidth: 580, maxHeight: "92vh", overflowY: "auto" as const,
  },
  label: {
    display: "block", fontSize: 11, color: "rgba(255,255,255,.4)",
    marginBottom: 5, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".04em",
  },
  input: {
    width: "100%", padding: "10px 13px", borderRadius: 11,
    border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.05)",
    color: "rgba(255,255,255,.9)", fontSize: 14, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box" as const, colorScheme: "dark" as const,
  },
  field: { marginBottom: 13 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" },
};

const ACCENT = "#00e5c3";
const AMBER  = "#f59e0b";

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BulkSellModal({ items, photoMap, profiles, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError]            = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  // Ricavo per articolo
  const [revenues, setRevenues] = useState<Record<string, string>>(
    () => Object.fromEntries(items.map(i => [i.id, ""]))
  );

  // Campi comuni
  const [buyer,     setBuyer]     = useState("");
  const [date,      setDate]      = useState(today);
  const [platform,  setPlatform]  = useState("vinted");
  const [notes,     setNotes]     = useState("");
  const [profileId, setProfileId] = useState(() => {
    // Pre-seleziona il profilo del primo articolo
    const pid = items[0]?.profile_id ?? "";
    if (!pid) return "";
    if (profiles.some(p => p.id === pid)) return pid;
    return profiles.find(p => p.name === pid)?.id ?? "";
  });

  const totalRevenue  = items.reduce((s, i) => s + (parseFloat(revenues[i.id] || "0") || 0), 0);
  const totalCost     = items.reduce((s, i) => s + Number(i.purchase_price ?? 0), 0);
  const totalProfit   = totalRevenue - totalCost;

  function handleSave() {
    setError(null);
    if (!buyer.trim()) return setError("Inserisci il nome dell'acquirente.");
    const hasRevenue = items.every(i => parseFloat(revenues[i.id] || "0") >= 0);
    if (!hasRevenue) return setError("Inserisci il ricavo per ogni articolo.");

    startTransition(async () => {
      try {
        await bulkSellStockItems({
          items: items.map(i => ({
            stockId:       i.id,
            stockName:     i.name ?? "",
            purchasePrice: Number(i.purchase_price ?? 0),
            externalId:    i.template_id_ext ?? "",
            profileId:     i.profile_id,
            salePrice:     parseFloat(revenues[i.id] || "0") || 0,
          })),
          buyerSeller: buyer,
          saleDate:    date,
          platform,
          notes,
          profileId:   profileId || null,
        });
        onClose();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Errore sconosciuto");
      }
    });
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div style={{ width: 36, height: 4, background: "rgba(255,255,255,.15)", borderRadius: 2, margin: "0 auto 18px" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ fontSize: 22 }}>🛒</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Vendita a blocco</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>{items.length} articoli selezionati</div>
          </div>
        </div>

        {/* Campi comuni */}
        <div style={S.field}>
          <label style={S.label}>Acquirente *</label>
          <input value={buyer} onChange={e => setBuyer(e.target.value)} style={S.input} placeholder="Nome acquirente" />
        </div>

        <div style={{ ...S.grid2, marginBottom: 13 }}>
          <div>
            <label style={S.label}>Data vendita</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={S.input} />
          </div>
          <div>
            <label style={S.label}>Piattaforma</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ ...S.input, appearance: "none" as const }}>
              <option value="vinted">Vinted</option>
              <option value="depop">Depop</option>
              <option value="ebay">eBay</option>
              <option value="altro">Altro</option>
            </select>
          </div>
        </div>

        <div style={S.field}>
          <label style={S.label}>Profilo / Account</label>
          <select value={profileId} onChange={e => setProfileId(e.target.value)} style={{ ...S.input, appearance: "none" as const }}>
            <option value="">— Nessun profilo —</option>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Divisore */}
        <div style={{ height: 1, background: "rgba(255,255,255,.07)", margin: "4px 0 16px" }} />

        {/* Distribuzione ricavi */}
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>
          Distribuzione ricavi
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {items.map(item => {
            const thumb = item.template_id_ext ? photoMap[item.template_id_ext] : null;
            return (
              <div key={item.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(255,255,255,.03)", borderRadius: 12,
                padding: "10px 12px", border: "1px solid rgba(255,255,255,.07)",
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 9, overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,.05)" }}>
                  {thumb
                    ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, opacity: .25 }}>📦</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name || "—"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>costo €{fmt(Number(item.purchase_price ?? 0))}{item.size ? ` · T.${item.size}` : ""}</div>
                </div>
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,.35)" }}>€</span>
                  <input
                    type="number" step="0.01" min="0"
                    value={revenues[item.id]}
                    onChange={e => setRevenues(prev => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder="0.00"
                    style={{ ...S.input, width: 90, padding: "8px 10px", fontSize: 13 }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Totale */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "rgba(0,229,195,.06)", border: "1px solid rgba(0,229,195,.15)",
          borderRadius: 12, padding: "12px 16px", marginBottom: 14,
        }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 3 }}>TOTALE BLOCCO</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: ACCENT }}>€{fmt(totalRevenue)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 3 }}>PROFITTO</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: totalProfit >= 0 ? ACCENT : "#ff4d6d" }}>
              {totalProfit >= 0 ? "+" : ""}€{fmt(totalProfit)}
            </div>
          </div>
        </div>

        {/* Note */}
        <div style={S.field}>
          <label style={S.label}>Note</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            style={{ ...S.input, minHeight: 60, resize: "vertical" }}
            placeholder="Note aggiuntive sul blocco..." />
        </div>

        {error && (
          <div style={{ marginBottom: 14, fontSize: 12, color: "#ff4d6d", padding: "8px 12px", background: "rgba(255,77,109,.08)", borderRadius: 8 }}>
            ❌ {error}
          </div>
        )}

        {/* Bottoni */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={isPending} style={{
            flex: 1, padding: "13px", borderRadius: 12,
            border: "1px solid rgba(255,255,255,.1)", background: "transparent",
            color: "rgba(255,255,255,.55)", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
          }}>Annulla</button>
          <button onClick={handleSave} disabled={isPending} style={{
            flex: 2, padding: "13px", borderRadius: 12,
            border: "1px solid rgba(0,229,195,.4)", background: "rgba(0,229,195,.12)",
            color: ACCENT, cursor: isPending ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
          }}>
            {isPending ? "Salvataggio…" : `Vendi ${items.length} articoli`}
          </button>
        </div>
      </div>
    </div>
  );
}
