"use client";
// src/components/RevenueChart.tsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

interface Props {
  data: { month: string; revenue: number; cost: number }[];
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12,
      padding: "10px 14px", boxShadow: "0 8px 24px rgba(0,0,0,.08)", fontSize: 12
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill, flexShrink: 0 }} />
          <span style={{ color: "#888" }}>{p.name}</span>
          <span style={{ fontWeight: 700, color: "#111", marginLeft: "auto" }}>€{Number(p.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

export default function RevenueChart({ data }: Props) {
  return (
    <div style={{
      background: "#ffffff",
      borderRadius: 20,
      padding: "24px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111111", letterSpacing: "-.02em" }}>Ricavi e costi mensili</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "#888" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#A8E63D", display: "inline-block" }} />
            Ricavi
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#111111", display: "inline-block" }} />
            Costi
          </span>
        </div>
      </div>
      {data.length === 0 ? (
        <div style={{ color: "#888", fontSize: 13, textAlign: "center", padding: "40px 0" }}>
          Nessun dato ancora — inizia a registrare transazioni!
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="0" stroke="#F5F5F5" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
            <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(0,0,0,.03)", radius: 6 }} />
            <Bar dataKey="revenue" name="Ricavi" fill="#A8E63D" radius={[6,6,0,0]} maxBarSize={28} />
            <Bar dataKey="cost" name="Costi" fill="#111111" radius={[6,6,0,0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
