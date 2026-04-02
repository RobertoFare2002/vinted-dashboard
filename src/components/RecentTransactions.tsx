"use client";
// src/components/RecentTransactions.tsx
import type { Transaction } from "@/lib/types";

const TYPE_META: Record<string, { label: string; dot: string }> = {
  sale:     { label: "Vendita",  dot: "#A8E63D" },
  purchase: { label: "Acquisto", dot: "#FF4D4D"  },
  return:   { label: "Reso",     dot: "#F5A623"  },
  expense:  { label: "Spesa",    dot: "#888888"  },
};

export default function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <div style={{
      background: "#ffffff",
      borderRadius: 20,
      padding: "24px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111111", letterSpacing: "-.02em", marginBottom: 18 }}>
        Ultime transazioni
      </h2>
      {transactions.length === 0 ? (
        <p style={{ color: "#888", fontSize: 13 }}>Nessuna transazione ancora.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {transactions.map(tx => {
            const meta = TYPE_META[tx.type] ?? { label: tx.type, dot: "#888" };
            const sign = tx.type === "sale" ? "+" : "-";
            const isPos = tx.type === "sale";
            return (
              <div key={tx.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "13px 0",
                borderBottom: "1px solid #EBEBEB",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "#F5F5F5",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.dot, display: "block" }} />
                  </div>
                  <div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{meta.label}</span>
                      {tx.platform && <span style={{ fontSize: 11, color: "#888" }}>{tx.platform}</span>}
                    </div>
                    {tx.buyer_seller && (
                      <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{tx.buyer_seller}</div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isPos ? "#111" : "#FF4D4D" }}>
                    {sign}€{Number(tx.amount).toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
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
