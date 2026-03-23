// src/app/(dashboard)/inventory/page.tsx
import { createClient } from "@/lib/supabase/server";
import type { InventoryItem } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  available: "Disponibile",
  listed:    "In vendita",
  sold:      "Venduto",
  reserved:  "Riservato",
  archived:  "Archiviato",
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
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Magazzino</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>
        {items.length} articoli totali
      </p>

      {/* Riepilogo stato */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} style={{
            padding: "8px 16px", borderRadius: 10,
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.10)",
            fontSize: 13
          }}>
            <span style={{ color: "rgba(255,255,255,.55)" }}>{label}: </span>
            <strong>{counts[key] ?? 0}</strong>
          </div>
        ))}
      </div>

      {/* Tabella */}
      <div style={{
        background: "rgba(18,18,22,.9)",
        border: "1px solid rgba(255,255,255,.10)",
        borderRadius: 14, overflow: "hidden"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{
                borderBottom: "1px solid rgba(255,255,255,.10)",
                background: "rgba(255,255,255,.03)"
              }}>
                {["Nome","Brand","Taglia","Cond.","Prezzo acq.","Prezzo vend.","Stato","Posizione"].map(h => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left",
                    color: "rgba(255,255,255,.55)", fontWeight: 500, whiteSpace: "nowrap"
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
                    padding: "48px 16px", textAlign: "center",
                    color: "rgba(255,255,255,.35)"
                  }}>
                    Nessun articolo ancora — aggiungili dall&apos;estensione!
                  </td>
                </tr>
              ) : items.map((item, i) => (
                <tr key={item.id} style={{
                  borderBottom: i < items.length - 1
                    ? "1px solid rgba(255,255,255,.05)"
                    : "none"
                }}>
                  <td style={{ padding: "12px 16px", fontWeight: 500 }}>{item.name}</td>
                  <td style={{ padding: "12px 16px", color: "rgba(255,255,255,.55)" }}>{item.brand || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "rgba(255,255,255,.55)" }}>{item.size || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "rgba(255,255,255,.55)" }}>{item.condition || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {item.purchase_price != null ? `€ ${Number(item.purchase_price).toFixed(2)}` : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#16c2a3" }}>
                    {item.selling_price != null ? `€ ${Number(item.selling_price).toFixed(2)}` : "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className={`badge badge-${item.status}`}>
                      {STATUS_LABELS[item.status]}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "rgba(255,255,255,.55)" }}>
                    {item.location || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
