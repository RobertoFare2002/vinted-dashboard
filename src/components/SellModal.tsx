// src/components/SellModal.tsx
"use client";

import { useRef, useTransition, useState } from "react";
import { sellStockItem } from "@/app/(dashboard)/stock/actions";

type StockItem = {
  id:             string;
  name:           string | null;
  purchase_price: number | null;
  template_id_ext: string | null;
  profile_id:     string | null;
  size:           string | null;
};

type Props = {
  item:    StockItem;
  thumb:   string | null;
  onClose: () => void;
};

const S = {
  overlay: {
    position: "fixed" as const, inset: 0, zIndex: 100,
    background: "rgba(0,0,0,.75)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  modal: {
    background: "#121216", border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 440,
    boxShadow: "0 32px 80px rgba(0,0,0,.6)",
  },
  label: {
    display: "block", fontSize: 11, color: "rgba(255,255,255,.45)",
    marginBottom: 5, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: ".04em",
  },
  input: {
    width: "100%", padding: "9px 12px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.06)",
    color: "rgba(255,255,255,.92)", fontSize: 14, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box" as const, colorScheme: "dark" as const,
  },
};

export default function SellModal({ item, thumb, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const priceRef    = useRef<HTMLInputElement>(null);
  const buyerRef    = useRef<HTMLInputElement>(null);
  const dateRef     = useRef<HTMLInputElement>(null);
  const notesRef    = useRef<HTMLTextAreaElement>(null);
  const platformRef = useRef<HTMLSelectElement>(null);

  const cost    = Number(item.purchase_price ?? 0);
  const name    = item.name ?? "Articolo";
  const hasSize = !!item.size;

  function handleSell() {
    setError(null);
    const price = parseFloat(priceRef.current?.value ?? "0");
    if (!price || price <= 0) return setError("Inserisci un prezzo di vendita valido.");

    startTransition(async () => {
      try {
        await sellStockItem({
          stockId:       item.id,
          stockName:     name,
          purchasePrice: cost,
          externalId:    item.template_id_ext ?? "",
          profileId:     item.profile_id  ?? null,
          salePrice:     price,
          buyerSeller:   buyerRef.current?.value    ?? "",
          saleDate:      dateRef.current?.value     ?? today,
          notes:         notesRef.current?.value    ?? "",
          platform:      platformRef.current?.value ?? "vinted",
        });
        onClose();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Errore sconosciuto");
      }
    });
  }

  const margin = cost > 0 && priceRef.current?.value
    ? Math.round(((parseFloat(priceRef.current.value) - cost) / cost) * 100)
    : null;

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>

        {/* Header con preview articolo */}
        <div style={{ display: "flex", gap: 14, marginBottom: 24, alignItems: "center" }}>
          <div style={{
            width: 60, height: 60, borderRadius: 12, flexShrink: 0,
            background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)",
            overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {thumb
              ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 24, opacity: .3 }}>📷</span>
            }
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>
              {hasSize ? `Taglia ${item.size}` : ""}
              {hasSize && cost > 0 ? " · " : ""}
              {cost > 0 ? `Costo acq. €${cost.toFixed(2)}` : ""}
            </div>
          </div>
        </div>

        {/* Prezzo vendita — campo principale */}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Prezzo vendita € *</label>
          <input
            ref={priceRef}
            style={{ ...S.input, fontSize: 20, fontWeight: 700, color: "#16c2a3" }}
            type="number" step="0.01" min="0"
            placeholder="0.00"
            autoFocus
          />
          {/* Margine live — aggiornato al blur per semplicità */}
          {cost > 0 && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 4 }}>
              Costo acquisto: €{cost.toFixed(2)}
              {" · "}
              <span style={{ color: "rgba(255,255,255,.5)" }}>il margine viene calcolato automaticamente</span>
            </div>
          )}
        </div>

        {/* Riga: acquirente + data */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", marginBottom: 16 }}>
          <div>
            <label style={S.label}>Acquirente</label>
            <input ref={buyerRef} style={S.input} placeholder="Nome utente Vinted…" />
          </div>
          <div>
            <label style={S.label}>Data vendita</label>
            <input ref={dateRef} style={S.input} type="date" defaultValue={today} />
          </div>
        </div>

        {/* Piattaforma */}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Piattaforma</label>
          <select ref={platformRef} style={S.input} defaultValue="vinted">
            <option value="vinted">Vinted</option>
            <option value="depop">Depop</option>
            <option value="ebay">eBay</option>
            <option value="altro">Altro</option>
          </select>
        </div>

        {/* Note */}
        <div style={{ marginBottom: 20 }}>
          <label style={S.label}>Note (opzionale)</label>
          <textarea
            ref={notesRef}
            style={{ ...S.input, minHeight: 56, resize: "vertical" }}
            placeholder="Dettagli ordine, spedizione…"
          />
        </div>

        {error && (
          <div style={{ marginBottom: 16, fontSize: 12, color: "#ff4d6d" }}>❌ {error}</div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={isPending} style={{
            flex: 1, padding: "10px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,.10)", background: "transparent",
            color: "rgba(255,255,255,.55)", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>
            Annulla
          </button>
          <button onClick={handleSell} disabled={isPending} style={{
            flex: 2, padding: "10px", borderRadius: 10,
            border: "1px solid rgba(22,194,163,.5)",
            background: "rgba(22,194,163,.15)", color: "#16c2a3",
            cursor: isPending ? "not-allowed" : "pointer",
            fontSize: 13, fontWeight: 700,
          }}>
            {isPending ? "Registrazione…" : "✅ Registra vendita"}
          </button>
        </div>

      </div>
    </div>
  );
}
