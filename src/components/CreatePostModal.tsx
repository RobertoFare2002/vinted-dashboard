// src/components/CreatePostModal.tsx
"use client";

import { useState, useTransition } from "react";
import { createFeedPost } from "@/app/(dashboard)/feed/actions";

type Prefill = {
  saleName?:     string;
  saleAmount?:   number;
  saleCost?:     number;
  salePlatform?: string;
  saleSize?:     string;
  photoUrl?:     string;
};

type Props = {
  prefill?:   Prefill;
  onClose:    () => void;
  onSuccess:  () => void;
};

const S = {
  overlay: {
    position: "fixed" as const, inset: 0, zIndex: 120,
    background: "rgba(0,0,0,.35)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  modal: {
    background: "#ffffff", borderRadius: 20, padding: "28px 24px",
    width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" as const,
    boxShadow: "0 24px 60px rgba(0,0,0,.14)",
  },
  label: {
    display: "block", fontSize: 11, color: "#888",
    marginBottom: 5, fontWeight: 600,
    textTransform: "uppercase" as const, letterSpacing: ".05em",
  },
  input: {
    width: "100%", padding: "10px 13px", borderRadius: 12,
    border: "1px solid #EBEBEB", background: "#F5F5F5",
    color: "#111", fontSize: 13, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box" as const,
  },
  field: { marginBottom: 14 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px", marginBottom: 14 },
};

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CreatePostModal({ prefill, onClose, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError]            = useState<string | null>(null);

  const [saleName,     setSaleName]     = useState(prefill?.saleName     ?? "");
  const [saleAmount,   setSaleAmount]   = useState(String(prefill?.saleAmount   ?? ""));
  const [saleCost,     setSaleCost]     = useState(String(prefill?.saleCost     ?? ""));
  const [salePlatform, setSalePlatform] = useState(prefill?.salePlatform ?? "vinted");
  const [saleSize,     setSaleSize]     = useState(prefill?.saleSize ?? "");
  const [photoUrl,     setPhotoUrl]     = useState(prefill?.photoUrl     ?? "");
  const [caption,      setCaption]      = useState("");

  const profit = (parseFloat(saleAmount) || 0) - (parseFloat(saleCost) || 0);
  const margin = parseFloat(saleCost) > 0
    ? Math.round((profit / parseFloat(saleCost)) * 100)
    : null;

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await createFeedPost({
          saleName,
          saleAmount:   parseFloat(saleAmount)   || 0,
          saleCost:     parseFloat(saleCost)      || 0,
          salePlatform,
          saleSize,
          photoUrl,
          caption,
        });
        onSuccess();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Errore sconosciuto");
      }
    });
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div style={{ width: 36, height: 4, background: "#EBEBEB", borderRadius: 2, margin: "0 auto 20px" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "#f0fad0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📸</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>Pubblica nel Feed</div>
            <div style={{ fontSize: 12, color: "#888" }}>Condividi la tua vendita con la community</div>
          </div>
        </div>

        {/* Preview foto */}
        {photoUrl && (
          <div style={{ width: "100%", aspectRatio: "1", borderRadius: 14, overflow: "hidden", background: "#f5f5f5", marginBottom: 16, border: "1px solid #EBEBEB" }}>
            <img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        {/* Dati vendita */}
        <div style={S.field}>
          <label style={S.label}>Nome articolo</label>
          <input value={saleName} onChange={e => setSaleName(e.target.value)} style={S.input} placeholder="Es. Nike Air Max 90" />
        </div>

        <div style={S.grid2}>
          <div>
            <label style={S.label}>Prezzo vendita €</label>
            <input type="number" step="0.01" value={saleAmount} onChange={e => setSaleAmount(e.target.value)} style={S.input} placeholder="0.00" />
          </div>
          <div>
            <label style={S.label}>Costo acquisto €</label>
            <input type="number" step="0.01" value={saleCost} onChange={e => setSaleCost(e.target.value)} style={S.input} placeholder="0.00" />
          </div>
        </div>

        {/* Profitto live */}
        {(parseFloat(saleAmount) > 0 || parseFloat(saleCost) > 0) && (
          <div style={{
            background: profit >= 0 ? "#f0fad0" : "#fff5f5",
            border: `1px solid ${profit >= 0 ? "#d8f3a0" : "#fecaca"}`,
            borderRadius: 12, padding: "10px 14px", marginBottom: 14,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Profitto</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: profit >= 0 ? "#6bb800" : "#FF4D4D" }}>
              {profit >= 0 ? "+" : ""}€{fmt(profit)}
              {margin !== null && <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 6 }}>({margin}%)</span>}
            </span>
          </div>
        )}

        <div style={S.grid2}>
          <div>
            <label style={S.label}>Piattaforma</label>
            <select value={salePlatform} onChange={e => setSalePlatform(e.target.value)} style={{ ...S.input, appearance: "none" as const }}>
              <option value="vinted">Vinted</option>
              <option value="depop">Depop</option>
              <option value="ebay">eBay</option>
              <option value="altro">Altro</option>
            </select>
          </div>
          <div>
            <label style={S.label}>Taglia (opzionale)</label>
            <input value={saleSize} onChange={e => setSaleSize(e.target.value)} style={S.input} placeholder="Es. M, 42, XL" />
          </div>
        </div>

        <div style={S.field}>
          <label style={S.label}>URL foto (opzionale)</label>
          <input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} style={S.input} placeholder="https://..." />
        </div>

        <div style={S.field}>
          <label style={S.label}>Didascalia</label>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            style={{ ...S.input, minHeight: 80, resize: "vertical" as const }}
            placeholder="Racconta qualcosa su questa vendita..."
          />
        </div>

        {error && (
          <div style={{ fontSize: 12, color: "#FF4D4D", background: "rgba(255,77,77,.07)", borderRadius: 10, padding: "9px 12px", marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 999, border: "1px solid #EBEBEB", background: "#fff", color: "#888", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Annulla
          </button>
          <button onClick={handleSubmit} disabled={isPending} style={{ flex: 2, padding: "11px", borderRadius: 999, border: "none", background: isPending ? "#aaa" : "#007782", color: "#fff", fontWeight: 700, fontSize: 13, cursor: isPending ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {isPending ? "Pubblicando..." : "Pubblica"}
          </button>
        </div>
      </div>
    </div>
  );
}
