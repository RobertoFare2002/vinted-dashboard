// src/app/(dashboard)/transactions/page.tsx
import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/lib/types";

const TYPE_META: Record<string, { label: string; color: string; dot: string; sign: string }> = {
  sale:     { label: "Vendita",  color: "#6bb800", dot: "#A8E63D", sign: "+" },
  purchase: { label: "Acquisto", color: "#FF4D4D", dot: "#FF4D4D", sign: "-" },
  return:   { label: "Reso",     color: "#F5A623", dot: "#F5A623", sign: "±" },
  expense:  { label: "Spesa",    color: "#888888", dot: "#888888", sign: "-" },
};

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .order("transaction_date", { ascending: false });

  const transactions = (data ?? []) as Transaction[];

  const totalRevenue = transactions
    .filter(t => t.type === "sale")
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalCost = transactions
    .filter(t => t.type !== "sale")
    .reduce((s, t) => s + Number(t.amount), 0);

  const profit = totalRevenue - totalCost;

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, color: "#111111", letterSpacing: "-.03em" }}>
          Transazioni
        </h1>
        <p style={{ color: "#888888", fontSize: 14, margin: 0 }}>
          Acquisti, vendite e spese registrate
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Totale ricavi",  value: `€ ${totalRevenue.toFixed(2)}`, color: "#6bb800" },
          { label: "Totale costi",   value: `€ ${totalCost.toFixed(2)}`,    color: "#FF4D4D" },
          { label: "Profitto netto", value: `€ ${profit.toFixed(2)}`,       color: profit >= 0 ? "#6bb800" : "#FF4D4D" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "#ffffff",
            border: "none",
            borderRadius: 20,
            padding: "20px 22px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: "#888888",
              textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10,
            }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums" }}>{value}</div>
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
                {["Data", "Tipo", "Importo", "Piattaforma", "Acquirente / Venditore", "Note"].map(h => (
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
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{
                    padding: "56px 16px", textAlign: "center",
                    color: "#888888", fontSize: 14,
                  }}>
                    Nessuna transazione ancora — registrane dall&apos;estensione!
                  </td>
                </tr>
              ) : transactions.map((tx, i) => {
                const meta = TYPE_META[tx.type] ?? { label: tx.type, color: "#888888", dot: "#888888", sign: "" };
                return (
                  <tr key={tx.id} style={{
                    borderBottom: i < transactions.length - 1 ? "1px solid #EBEBEB" : "none",
                  }}>
                    <td style={{ padding: "13px 16px", color: "#888888", whiteSpace: "nowrap", fontSize: 12 }}>
                      {new Date(tx.transaction_date).toLocaleDateString("it")}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      {/* Dot + label — no pill background */}
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 12, fontWeight: 600, color: meta.color,
                      }}>
                        <span style={{
                          width: 7, height: 7, borderRadius: "50%",
                          background: meta.dot, display: "inline-block", flexShrink: 0,
                        }} />
                        {meta.label}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px", fontWeight: 700, color: meta.color, fontVariantNumeric: "tabular-nums" }}>
                      {meta.sign}€{Number(tx.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: "13px 16px", color: "#888888" }}>
                      {tx.platform || "—"}
                    </td>
                    <td style={{ padding: "13px 16px", color: "#111111", fontWeight: 500 }}>
                      {tx.buyer_seller || "—"}
                    </td>
                    <td style={{ padding: "13px 16px", color: "#888888" }}>
                      {tx.notes || "—"}
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
