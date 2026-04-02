// src/components/StockEditModal.tsx
"use client";

import { useRef, useTransition, useState, useMemo } from "react";
import { updateStockItem } from "@/app/(dashboard)/stock/actions";

type StockItem = {
  id: string; name: string|null; size: string|null; quantity: number|null;
  purchase_price: number|null; purchased_at: string|null; location: string|null;
  status: string|null; template_id_ext: string|null; profile_id: string|null;
};

type Profile = { id: string; name: string };

type Props = {
  item:     StockItem;
  thumb:    string | null;
  onClose:  () => void;
  profiles: Profile[];
};

const S = {
  overlay: {
    position: "fixed" as const, inset: 0, zIndex: 100,
    background: "rgba(0,0,0,.35)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "flex-end", justifyContent: "center",
  },
  sheet: {
    background: "#ffffff",
    border: "none",
    borderRadius: "20px 20px 0 0",
    padding: "20px 18px 32px",
    width: "100%", maxWidth: 560,
    maxHeight: "90vh", overflowY: "auto" as const,
    boxShadow: "0 -8px 40px rgba(0,0,0,.12)",
  },
  label: {
    display: "block", fontSize: 11, color: "#888888",
    marginBottom: 5, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".05em",
  },
  input: {
    width: "100%", padding: "10px 13px", borderRadius: 12,
    border: "1px solid #EBEBEB", background: "#F5F5F5",
    color: "#111111", fontSize: 13, fontFamily: "inherit",
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

export default function StockEditModal({ item, thumb, onClose, profiles }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nameRef   = useRef<HTMLInputElement>(null);
  const sizeRef   = useRef<HTMLInputElement>(null);
  const qtyRef    = useRef<HTMLInputElement>(null);
  const priceRef  = useRef<HTMLInputElement>(null);
  const dateRef   = useRef<HTMLInputElement>(null);
  const notesRef  = useRef<HTMLTextAreaElement>(null);
  const statusRef = useRef<HTMLSelectElement>(null);

  const resolvedProfileId = useMemo(() => {
    if (!item.profile_id) return "";
    if (profiles.some(p => p.id === item.profile_id)) return item.profile_id;
    const byName = profiles.find(p => p.name === item.profile_id);
    return byName?.id ?? "";
  }, [item.profile_id, profiles]);

  const [selectedProfile, setSelectedProfile] = useState(resolvedProfileId);

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
          notes:          notesRef.current?.value   ?? "",
          status:         statusRef.current?.value  ?? "available",
          profile_id:     selectedProfile || null,
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
        <div style={{ width: 36, height: 4, background: "#EBEBEB", borderRadius: 2, margin: "0 auto 18px" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          {thumb && (
            <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: "1px solid #EBEBEB" }}>
              <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111111" }}>Modifica articolo</div>
            <div style={{ fontSize: 11, color: "#888888" }}>Magazzino</div>
          </div>
        </div>

        <div style={S.field}>
          <label style={S.label}>Nome articolo *</label>
          <input ref={nameRef} style={S.input} defaultValue={item.name ?? ""} placeholder="Nome articolo" />
        </div>

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

        <div style={S.field}>
          <label style={S.label}>Stato</label>
          <select ref={statusRef} style={{ ...S.input, appearance: "none" as const }} defaultValue={item.status ?? "available"}>
            {STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div style={S.field}>
          <label style={S.label}>Profilo</label>
          <select value={selectedProfile} onChange={e => setSelectedProfile(e.target.value)} style={{ ...S.input, appearance: "none" as const }}>
            <option value="">— Nessun profilo —</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={S.field}>
          <label style={S.label}>Note</label>
          <textarea ref={notesRef} style={{ ...S.input, minHeight: 70, resize: "vertical" }}
            defaultValue={""}
            placeholder="Note aggiuntive..." />
        </div>

        {error && (
          <div style={{ marginBottom: 14, fontSize: 12, color: "#FF4D4D", padding: "9px 12px", background: "rgba(255,77,77,.07)", borderRadius: 10 }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button onClick={onClose} disabled={isPending} style={{
            flex: 1, padding: "13px", borderRadius: 999,
            border: "1px solid #EBEBEB", background: "#ffffff",
            color: "#888888", cursor: "pointer", fontSize: 13, fontWeight: 600,
            fontFamily: "inherit",
          }}>Annulla</button>
          <button onClick={handleSave} disabled={isPending} style={{
            flex: 2, padding: "13px", borderRadius: 999,
            border: "none", background: "#007782", color: "#ffffff",
            cursor: isPending ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700,
            fontFamily: "inherit", opacity: isPending ? .7 : 1,
          }}>
            {isPending ? "Salvataggio…" : "Salva modifiche"}
          </button>
        </div>
      </div>
    </div>
  );
}
