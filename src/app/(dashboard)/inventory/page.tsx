// src/app/(dashboard)/inventory/page.tsx
import { createClient } from "@/lib/supabase/server";
import type { InventoryItem } from "@/lib/types";

const STATUS_META: Record<string, { label: string; dot: string; color: string }> = {
  available: { label: "Disponibile", dot: "#A8E63D", color: "#6bb800" },
  listed:    { label: "In vendita",  dot: "#3b82f6", color: "#3b82f6" },
  sold:      { label: "Venduto",     dot: "#888888", color: "#888888" },
  reserved:  { label: "Riservato",   dot: "#F5A623", color: "#F5A623" },
  archived:  { label: "Archiviato",  dot: "#888888", color: "#888888" },
};

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory")
    .select("*")
    .order("created_at", { ascending: false });

  const items = (data ?? []) as InventoryItem[];

  const counts = items.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, color: "#111111", letterSpacing: "-.03em" }}>
          Magazzino
        </h1>
        <p style={{ color: "#888888", fontSize: 14, margin: 0 }}>
          {items.length} articoli totali
        </p>
      </div>

      {/* Status summary chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <div key={key} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 999,
            background: "#ffffff",
            border: "1px solid #EBEBEB",
            fontSize: 12, fontWeight: 600,
            boxShadow: "0 2px 8px rgba(0,0,0,.04)",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: meta.dot, display: "inline-block", flexShrink: 0,
            }} />
            <span style={{ color: "#888888" }}>{meta.label}</span>
            <span style={{ color: "#111111", fontWeight: 800 }}>{counts[key] ?? 0}</span>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{
        background: "#ffffff",
        border: "none",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #EBEBEB" }}>
                {["Nome", "Brand", "Taglia", "Cond.", "Prezzo acq.", "Prezzo vend.", "Stato", "Posizione"].map(h => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left",
                    color: "#888888", fontSize: 11, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: ".05em",
                    whiteSpace: "nowrap",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{
                    padding: "56px 16px", textAlign: "center",
                    color: "#888888", fontSize: 14,
                  }}>
                    Nessun articolo ancora — aggiungili dall&apos;estensione!
                  </td>
                </tr>
              ) : items.map((item, i) => {
                const meta = STATUS_META[item.status] ?? STATUS_META.available;
                return (
                  <tr key={item.id} style={{
                    borderBottom: i < items.length - 1 ? "1px solid #EBEBEB" : "none",
                  }}>
                    <td style={{ padding: "13px 16px", fontWeight: 600, color: "#111111" }}>{item.name}</td>
                    <td style={{ padding: "13px 16px", color: "#888888" }}>{item.brand || "—"}</td>
                    <td style={{ padding: "13px 16px", color: "#888888" }}>{item.size || "—"}</td>
                    <td style={{ padding: "13px 16px", color: "#888888" }}>{item.condition || "—"}</td>
                    <td style={{ padding: "13px 16px", color: "#111111", fontVariantNumeric: "tabular-nums" }}>
                      {item.purchase_price != null ? `€ ${Number(item.purchase_price).toFixed(2)}` : "—"}
                    </td>
                    <td style={{ padding: "13px 16px", color: "#6bb800", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {item.selling_price != null ? `€ ${Number(item.selling_price).toFixed(2)}` : "—"}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 11, fontWeight: 600, color: meta.color,
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: meta.dot, display: "inline-block",
                        }} />
                        {meta.label}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px", color: "#888888" }}>
                      {item.location || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
