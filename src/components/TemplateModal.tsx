// src/components/TemplateModal.tsx
"use client";

import { useRef, useTransition, useState } from "react";
import { updateTemplate } from "@/app/(dashboard)/templates/actions";
import type { Template } from "@/lib/types";

type Props = {
  template: Template;
  onClose:  () => void;
};

const S = {
  overlay: {
    position: "fixed" as const, inset: 0, zIndex: 100,
    background: "rgba(0,0,0,.35)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    overflowY: "auto" as const,
  },
  modal: {
    background: "#ffffff", border: "none",
    borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 560,
    boxShadow: "0 24px 60px rgba(0,0,0,.14)",
    margin: "auto",
  },
  title: { fontSize: 17, fontWeight: 700, color: "#111111", marginBottom: 20 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", marginBottom: 12 },
  field: { marginBottom: 12 },
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
  row: { display: "flex", gap: 10, marginTop: 24 },
};

export default function TemplateModal({ template: tpl, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nameRef        = useRef<HTMLInputElement>(null);
  const titleRef       = useRef<HTMLInputElement>(null);
  const priceRef       = useRef<HTMLInputElement>(null);
  const brandRef       = useRef<HTMLInputElement>(null);
  const sizeRef        = useRef<HTMLInputElement>(null);
  const conditionRef   = useRef<HTMLInputElement>(null);
  const categoryRef    = useRef<HTMLInputElement>(null);
  const colorsRef      = useRef<HTMLInputElement>(null);
  const materialsRef   = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  function handleSave() {
    setError(null);
    const name = nameRef.current?.value.trim() ?? "";
    if (!name) return setError("Il nome è obbligatorio.");

    startTransition(async () => {
      try {
        await updateTemplate(tpl.id, {
          name,
          title:       titleRef.current?.value       ?? "",
          description: descriptionRef.current?.value ?? "",
          price:       priceRef.current?.value ? parseFloat(priceRef.current.value) : null,
          category:    categoryRef.current?.value    ?? "",
          brand:       brandRef.current?.value       ?? "",
          size:        sizeRef.current?.value        ?? "",
          condition:   conditionRef.current?.value   ?? "",
          colors:      colorsRef.current?.value      ?? "",
          materials:   materialsRef.current?.value   ?? "",
        });
        onClose();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Errore sconosciuto");
      }
    });
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.title}>Modifica template</div>

        <div style={S.field}>
          <label style={S.label}>Nome interno *</label>
          <input ref={nameRef} style={S.input} defaultValue={tpl.name} />
        </div>

        <div style={S.field}>
          <label style={S.label}>Titolo annuncio Vinted</label>
          <input ref={titleRef} style={S.input} defaultValue={tpl.title ?? ""} placeholder="Titolo che appare su Vinted" />
        </div>

        <div style={S.grid2}>
          <div>
            <label style={S.label}>Brand</label>
            <input ref={brandRef} style={S.input} defaultValue={tpl.brand ?? ""} />
          </div>
          <div>
            <label style={S.label}>Taglia</label>
            <input ref={sizeRef} style={S.input} defaultValue={tpl.size ?? ""} placeholder="M / 42 / XL" />
          </div>
        </div>

        <div style={S.grid2}>
          <div>
            <label style={S.label}>Prezzo €</label>
            <input ref={priceRef} style={S.input} type="number" step="0.01" min="0"
              defaultValue={tpl.price ?? ""} placeholder="0.00" />
          </div>
          <div>
            <label style={S.label}>Condizione</label>
            <input ref={conditionRef} style={S.input} defaultValue={tpl.condition ?? ""} placeholder="Nuovo con etichetta…" />
          </div>
        </div>

        <div style={S.field}>
          <label style={S.label}>Categoria</label>
          <input ref={categoryRef} style={S.input} defaultValue={tpl.category ?? ""} placeholder="Uomo > Scarpe > Sneakers" />
        </div>

        <div style={S.grid2}>
          <div>
            <label style={S.label}>Colori</label>
            <input ref={colorsRef} style={S.input} defaultValue={tpl.colors ?? ""} placeholder="Nero, Bianco" />
          </div>
          <div>
            <label style={S.label}>Materiali</label>
            <input ref={materialsRef} style={S.input} defaultValue={tpl.materials ?? ""} placeholder="Pelle, Cotone" />
          </div>
        </div>

        <div style={S.field}>
          <label style={S.label}>Descrizione</label>
          <textarea ref={descriptionRef}
            style={{ ...S.input, minHeight: 100, resize: "vertical" }}
            defaultValue={tpl.description ?? ""}
            placeholder="Descrizione dell'annuncio…"
          />
        </div>

        {error && (
          <div style={{ marginBottom: 12, fontSize: 12, color: "#FF4D4D", padding: "9px 12px", background: "rgba(255,77,77,.07)", borderRadius: 10 }}>
            ⚠ {error}
          </div>
        )}

        <div style={S.row}>
          <button onClick={onClose} disabled={isPending} style={{
            flex: 1, padding: "11px", borderRadius: 999,
            border: "1px solid #EBEBEB", background: "#ffffff",
            color: "#888888", cursor: "pointer", fontSize: 13, fontWeight: 600,
            fontFamily: "inherit",
          }}>Annulla</button>
          <button onClick={handleSave} disabled={isPending} style={{
            flex: 2, padding: "11px", borderRadius: 999,
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
