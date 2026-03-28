// src/components/StockEditModal.tsx
"use client";

import { useRef, useTransition, useState } from "react";
import { updateStockItem } from "@/app/(dashboard)/stock/actions";

type StockItem = {
  id: string; name: string|null; size: string|null; quantity: number|null;
  purchase_price: number|null; purchased_at: string|null; location: string|null;
  status: string|null; template_id_ext: string|null;
};

type Props = {
  item:    StockItem;
  thumb:   string | null;
  onClose: () => void;
};

const S = {
  overlay: {
    position: "fixed" as const, inset: 0, zIndex: 100,
    background: "rgba(0,0,0,.8)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "flex-end", justifyContent: "center",
    padding: "0 0 0 0",
  },
  sheet: {
    background: "#0f1520",
    border: "1px solid rgba(255,255,255,.1)",
    borderRadius: "20px 20px 0 0",
    padding: "20px 18px 32px",
    width: "100%", maxWidth: 560,
    maxHeight: "90vh", overflowY: "auto" as const,
  },
  label: {
    display: "block", fontSize: 11, color: "rgba(255,255,255,.4)",
    marginBottom: 5, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".04em",
  },
  input: {
    width: "100%", padding: "11px 13px", borderRadius: 11,
    border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.05)",
    color: "rgba(255,255,255,.9)", fontSize: 14, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box" as const,
  },
  field: { marginBottom: 14 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" },
};

const STATUSES = [
  { value: "available", label: "Disponibile" },
  { value: "reserved",  label: "In sospeso"  },
  { value: "sold",      label: "Venduto"      },
  { value: "archived",  label: "Archiviato"   },
];

export default function StockEditModal({ item, thumb, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nameRef    = useRef<HTMLInputElement>(null);
  const sizeRef    = useRef<HTMLInputElement>(null);
  const qtyRef     = useRef<HTMLInputElement>(null);
  const priceRef   = useRef<HTMLInputElement>(null);
  const dateRef    = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const notesRef   = useRef<HTMLTextAreaElement>(null);
  const statusRef  = useRef<HTMLSelectElement>(null);

  const defaultDate = item.purchased_at
    ? new Date(item.purchased_at).toISOString().slice(0, 10)
    : "";

  function handleSave() {
    setError(null);
    const name = nameRef.current?.value.trim() ?? "";
    if (!name) return setError("Il nome è obbligatorio.");

    startTransition(async () => {
      try {
        await updateStockItem(item.id, {
          name,
          size:           sizeRef.current?.value        ?? "",
          quantity:       parseInt(qtyRef.current?.value ?? "1") || 1,
          purchase_price: priceRef.current?.value ? parseFloat(priceRef.current.value) : null,
          purchased_at:   dateRef.current?.value || null,
          location:       locationRef.current?.value ?? "",
          notes:          notesRef.current?.value   ?? "",
          status:         statusRef.current?.value  ?? "available",
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

        {/* Handle bar */}
        <div style={{ width: 36, height: 4, background: "rgba(255,255,255,.15)", borderRadius: 2, margin: "0 auto 18px" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          {thumb && (
            <div style={{ width: 44, height: 44, borderRadius: 9, overflow: "hidden", flexShrink: 0 }}>
              <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Modifica articolo</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>Magazzino</div>
          </div>
        </div>

        {/* Nome */}
        <div style={S.field}>
          <label style={S.label}>Nome articolo *</label>
          <input ref={nameRef} style={S.input} defaultValue={item.name ?? ""} placeholder="Nome articolo" />
        </div>

        {/* Taglia / Qtà */}
        <div style={{ ...S.grid2, marginBottom: 14 }}>
          <div>
            <label style={S.label}>Taglia</label>
            <input ref={sizeRef} style={S.input} defaultValue={item.size ?? ""} placeholder="42 / M / XL" />
          </div>
          <div>
            <label style={S.label}>Quantità</label>
            <input ref={qtyRef} style={S.input} type="number" min="1" defaultValue={item.quantity ?? 1} />
          </div>
        </div>

        {/* Prezzo / Data */}
        <div style={{ ...S.grid2, marginBottom: 14 }}>
          <div>
            <label style={S.label}>Prezzo acquisto €</label>
            <input ref={priceRef} style={S.input} type="number" step="0.01" min="0" defaultValue={item.purchase_price ?? ""} placeholder="0.00" />
          </div>
          <div>
            <label style={S.label}>Data acquisto</label>
            <input ref={dateRef} style={S.input} type="date" defaultValue={defaultDate} />
          </div>
        </div>

        {/* Stato */}
        <div style={S.field}>
          <label style={S.label}>Stato</label>
          <select ref={statusRef} style={{ ...S.input, appearance: "none" as const }} defaultValue={item.status ?? "available"}>
            {STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Posizione */}
        <div style={S.field}>
          <label style={S.label}>Posizione / Scaffale</label>
          <input ref={locationRef} style={S.input} defaultValue={item.location ?? ""} placeholder="es. Scaffale A, Scatola 3" />
        </div>

        {/* Note */}
        <div style={S.field}>
          <label style={S.label}>Note</label>
          <textarea ref={notesRef} style={{ ...S.input, minHeight: 70, resize: "vertical" }}
            defaultValue={""}
            placeholder="Note aggiuntive..." />
        </div>

        {error && (
          <div style={{ marginBottom: 14, fontSize: 12, color: "#ff4d6d", padding: "8px 12px", background: "rgba(255,77,109,.08)", borderRadius: 8 }}>
            ❌ {error}
          </div>
        )}

        {/* Bottoni */}
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button onClick={onClose} disabled={isPending} style={{
            flex: 1, padding: "13px", borderRadius: 12,
            border: "1px solid rgba(255,255,255,.1)", background: "transparent",
            color: "rgba(255,255,255,.55)", cursor: "pointer", fontSize: 14, fontWeight: 600,
          }}>Annulla</button>
          <button onClick={handleSave} disabled={isPending} style={{
            flex: 2, padding: "13px", borderRadius: 12,
            border: "1px solid rgba(22,194,163,.4)",
            background: "rgba(22,194,163,.12)", color: "#16c2a3",
            cursor: isPending ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700,
          }}>
            {isPending ? "Salvataggio…" : "Salva modifiche"}
          </button>
        </div>
      </div>
    </div>
  );
}
