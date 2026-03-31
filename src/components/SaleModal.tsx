// src/components/SaleModal.tsx
"use client";

import { useRef, useTransition, useState, useMemo } from "react";
import { createSale, updateSale } from "@/app/(dashboard)/sales/actions";

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
};

type Template  = { id: string; name: string };
type Profile   = { id: string; name: string };
type BulkItem  = { stock_id: string; name: string; sale_price: number; cost: number };

type Props = {
  mode:        "add" | "edit";
  sale?:       SaleRow;
  templates?:  Template[];
  profiles?:   Profile[];
  bulkItems?:  BulkItem[];
  onClose:     () => void;
};

// ── Stili condivisi ───────────────────────────────────────────────────────────

const S = {
  overlay: {
    position: "fixed" as const, inset: 0, zIndex: 100,
    background: "rgba(0,0,0,.72)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "16px",
  },
  modal: {
    background: "#121216", border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 520,
    maxHeight: "90vh", overflowY: "auto" as const,
    boxShadow: "0 32px 80px rgba(0,0,0,.6)",
  },
  title: { fontSize: 17, fontWeight: 700, marginBottom: 20, color: "rgba(255,255,255,.95)" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", marginBottom: 12 },
  field: { marginBottom: 12 },
  label: { display: "block", fontSize: 11, color: "rgba(255,255,255,.45)", marginBottom: 5, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: ".04em" },
  input: {
    width: "100%", padding: "9px 12px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.06)",
    color: "rgba(255,255,255,.92)", fontSize: 13, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box" as const, colorScheme: "dark" as const,
  },
  row: { display: "flex", gap: 10, marginTop: 24 },
  btnPrimary: {
    flex: 1, padding: "10px", borderRadius: 10, border: "1px solid rgba(22,194,163,.5)",
    background: "rgba(22,194,163,.15)", color: "#16c2a3", fontWeight: 650,
    fontSize: 13, cursor: "pointer", transition: "background .15s",
  },
  btnGhost: {
    flex: 1, padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,.10)",
    background: "transparent", color: "rgba(255,255,255,.55)", fontWeight: 600,
    fontSize: 13, cursor: "pointer",
  },
  err: { marginTop: 12, fontSize: 12, color: "#ff4d6d" },
};

// ── Componente ────────────────────────────────────────────────────────────────

function fmtM(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SaleModal({ mode, sale, templates = [], profiles = [], bulkItems, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  // Refs per i campi
  const buyerRef    = useRef<HTMLInputElement>(null);
  const amountRef   = useRef<HTMLInputElement>(null);
  const costRef     = useRef<HTMLInputElement>(null);
  const platformRef = useRef<HTMLSelectElement>(null);
  const statusRef   = useRef<HTMLSelectElement>(null);
  const dateRef     = useRef<HTMLInputElement>(null);
  const tplRef      = useRef<HTMLSelectElement>(null);
  const notesRef    = useRef<HTMLTextAreaElement>(null);

  // Profilo controllato — risolve UUID o nome legacy
  const resolvedProfileId = useMemo(() => {
    if (!sale?.profile_id) return "";
    if (profiles.some(p => p.id === sale.profile_id)) return sale.profile_id;
    const byName = profiles.find(p => p.name === sale.profile_id);
    return byName?.id ?? "";
  }, [sale?.profile_id, profiles]);

  const [selectedProfile, setSelectedProfile] = useState(resolvedProfileId);

  function getValues() {
    return {
      buyer_seller:     buyerRef.current?.value    ?? "",
      amount:           parseFloat(amountRef.current?.value ?? "0") || 0,
      cost:             parseFloat(costRef.current?.value   ?? "0") || 0,
      platform:         platformRef.current?.value ?? "vinted",
      status:           statusRef.current?.value   ?? "open",
      transaction_date: dateRef.current?.value     ?? today,
      template_id_ext:  tplRef.current?.value      || null,
      profile_id:       selectedProfile             || null,
      notes:            notesRef.current?.value     ?? "",
    };
  }

  function handleSubmit() {
    setError(null);
    const vals = getValues();
    if (!vals.buyer_seller) return setError("Il campo Prodotto/Acquirente è obbligatorio.");

    startTransition(async () => {
      try {
        if (mode === "add") {
          await createSale(vals);
        } else if (sale?.id) {
          await updateSale(sale.id, vals);
        }
        onClose();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Errore sconosciuto");
      }
    });
  }

  // Stoppa propagazione click sul modal (non chiude overlay)
  function stopProp(e: React.MouseEvent) { e.stopPropagation(); }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={stopProp}>
        <div style={S.title}>
          {mode === "add" ? "➕ Nuova vendita" : "✏️ Modifica vendita"}
        </div>

        {/* Riga 1: Prodotto / Importo */}
        <div style={S.grid2}>
          <div>
            <label style={S.label}>Prodotto / Acquirente *</label>
            <input ref={buyerRef} style={S.input} defaultValue={sale?.buyer_seller ?? ""} placeholder="Es. Nike Air Max" />
          </div>
          <div>
            <label style={S.label}>Prezzo vendita €</label>
            <input ref={amountRef} style={S.input} type="number" step="0.01" min="0" defaultValue={sale?.amount ?? ""} placeholder="0.00" />
          </div>
        </div>

        {/* Riga 2: Costo / Piattaforma */}
        <div style={S.grid2}>
          <div>
            <label style={S.label}>Costo acquisto €</label>
            <input ref={costRef} style={S.input} type="number" step="0.01" min="0" defaultValue={sale?.cost ?? ""} placeholder="0.00" />
          </div>
          <div>
            <label style={S.label}>Piattaforma</label>
            <select ref={platformRef} style={S.input} defaultValue={sale?.platform ?? "vinted"}>
              <option value="vinted">Vinted</option>
              <option value="depop">Depop</option>
              <option value="ebay">eBay</option>
              <option value="altro">Altro</option>
            </select>
          </div>
        </div>

        {/* Riga 3: Stato / Data */}
        <div style={S.grid2}>
          <div>
            <label style={S.label}>Stato</label>
            <select ref={statusRef} style={S.input} defaultValue={sale?.status ?? "open"}>
              <option value="open">In sospeso</option>
              <option value="closed">Conclusa</option>
            </select>
          </div>
          <div>
            <label style={S.label}>Data</label>
            <input ref={dateRef} style={S.input} type="date"
              defaultValue={sale?.transaction_date
                ? new Date(sale.transaction_date).toISOString().slice(0, 10)
                : today}
            />
          </div>
        </div>

        {/* Riga 4: Template / Profilo */}
        <div style={S.grid2}>
          <div>
            <label style={S.label}>Template collegato</label>
            <select ref={tplRef} style={S.input} defaultValue={sale?.template_id_ext ?? ""}>
              <option value="">— nessuno —</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={S.label}>Profilo / Account</label>
            <select value={selectedProfile} onChange={e => setSelectedProfile(e.target.value)} style={S.input}>
              <option value="">— Nessun profilo —</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Articoli del blocco (sola lettura) */}
        {bulkItems && bulkItems.length > 0 && (
          <div style={S.field}>
            <label style={S.label}>Articoli nel blocco ({bulkItems.length})</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {bulkItems.map((item, i) => (
                <div key={item.stock_id || i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 11px", borderRadius: 9,
                  background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
                  gap: 8,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.name || "—"}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)", flexShrink: 0 }}>
                    costo €{fmtM(item.cost)}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#00e5c3", flexShrink: 0 }}>
                    €{fmtM(item.sale_price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note */}
        <div style={S.field}>
          <label style={S.label}>Note</label>
          <textarea ref={notesRef} style={{ ...S.input, minHeight: 64, resize: "vertical" }}
            defaultValue={sale?.notes ?? ""} placeholder="Descrizione, ordine, dettagli…"
          />
        </div>

        {error && <div style={S.err}>❌ {error}</div>}

        <div style={S.row}>
          <button style={S.btnGhost} onClick={onClose} disabled={isPending}>Annulla</button>
          <button style={S.btnPrimary} onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Salvataggio…" : mode === "add" ? "Aggiungi vendita" : "Salva modifiche"}
          </button>
        </div>
      </div>
    </div>
  );
}
