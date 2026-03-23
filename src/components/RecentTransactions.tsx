"use client";
// src/components/RecentTransactions.tsx
import type { Transaction } from "@/lib/types";

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  sale:     { label: "Vendita",  color: "var(--accent)" },
  purchase: { label: "Acquisto", color: "var(--danger)"  },
  return:   { label: "Reso",     color: "#f59e0b"        },
  expense:  { label: "Spesa",    color: "#c084fc"        },
};

export default function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <div style={{
      background: "rgba(18,18,22,.9)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "20px"
    }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Ultime transazioni</h2>
      {transactions.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Nessuna transazione ancora.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {transactions.map(tx => {
            const meta = TYPE_LABEL[tx.type] ?? { label: tx.type, color: "var(--muted)" };
            const sign = tx.type === "sale" ? "+" : "-";
            return (
              <div key={tx.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 12px", borderRadius: 10,
                background: "rgba(255,255,255,.03)",
                border: "1px solid rgba(255,255,255,.05)"
              }}>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: meta.color,
                      background: meta.color + "20",
                      padding: "2px 7px", borderRadius: 6
                    }}>{meta.label}</span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{tx.platform}</span>
                  </div>
                  {tx.buyer_seller && (
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                      {tx.buyer_seller}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: meta.color }}>
                    {sign}€{Number(tx.amount).toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    {new Date(tx.transaction_date).toLocaleDateString("it")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
