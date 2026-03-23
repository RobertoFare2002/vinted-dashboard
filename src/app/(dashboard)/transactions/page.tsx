// src/app/(dashboard)/transactions/page.tsx
import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/lib/types";

const TYPE_META: Record<string, { label: string; color: string; sign: string }> = {
  sale:     { label: "Vendita",  color: "#16c2a3", sign: "+" },
  purchase: { label: "Acquisto", color: "#ff4d6d", sign: "-" },
  return:   { label: "Reso",     color: "#c084fc", sign: "±" },
  expense:  { label: "Spesa",    color: "#f59e0b", sign: "-" },
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
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Transazioni</h1>
      <p style={{ color: "rgba(255,255,255,.55)", fontSize: 14, marginBottom: 24 }}>
        Acquisti, vendite e spese registrate
      </p>

      {/* Sommario */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Totale ricavi",  value: `€ ${totalRevenue.toFixed(2)}`, color: "#16c2a3" },
          { label: "Totale costi",   value: `€ ${totalCost.toFixed(2)}`,    color: "#ff4d6d" },
          { label: "Profitto netto", value: `€ ${profit.toFixed(2)}`,       color: profit >= 0 ? "#16c2a3" : "#ff4d6d" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "rgba(18,18,22,.9)",
            border: "1px solid rgba(255,255,255,.10)",
            borderRadius: 14, padding: "18px 20px"
          }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
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
                {["Data","Tipo","Importo","Piattaforma","Acquirente / Venditore","Note"].map(h => (
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
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{
                    padding: "48px 16px", textAlign: "center",
                    color: "rgba(255,255,255,.35)"
                  }}>
                    Nessuna transazione ancora — registrane dall&apos;estensione!
                  </td>
                </tr>
              ) : transactions.map((tx, i) => {
                const meta = TYPE_META[tx.type] ?? { label: tx.type, color: "rgba(255,255,255,.55)", sign: "" };
                return (
                  <tr key={tx.id} style={{
                    borderBottom: i < transactions.length - 1
                      ? "1px solid rgba(255,255,255,.05)"
                      : "none"
                  }}>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,.55)", whiteSpace: "nowrap" }}>
                      {new Date(tx.transaction_date).toLocaleDateString("it")}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: meta.color,
                        background: meta.color + "20",
                        padding: "3px 8px", borderRadius: 6
                      }}>
                        {meta.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: meta.color }}>
                      {meta.sign}€{Number(tx.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,.55)" }}>
                      {tx.platform || "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,.55)" }}>
                      {tx.buyer_seller || "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,.55)" }}>
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
