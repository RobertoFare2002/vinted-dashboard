"use client";
// src/components/RevenueChart.tsx
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface Props {
  data: { month: string; revenue: number; cost: number }[];
}

export default function RevenueChart({ data }: Props) {
  return (
    <div style={{
      background: "rgba(18,18,22,.9)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "20px 24px"
    }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Ricavi e costi mensili</h2>
      {data.length === 0 ? (
        <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "40px 0" }}>
          Nessun dato ancora — inizia a registrare transazioni!
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#16c2a3" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#16c2a3" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ff4d6d" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ff4d6d" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
            <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,.45)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,.45)", fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `€${v}`} />
            <Tooltip
              contentStyle={{ background: "#1a1a20", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, fontSize: 13 }}
              labelStyle={{ color: "rgba(255,255,255,.8)" }}
              formatter={(val: any) => [`€ ${Number(val).toFixed(2)}`]}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: "rgba(255,255,255,.6)" }} />
            <Area type="monotone" dataKey="revenue" name="Ricavi" stroke="#16c2a3" strokeWidth={2} fill="url(#gRevenue)" />
            <Area type="monotone" dataKey="cost"    name="Costi"  stroke="#ff4d6d" strokeWidth={2} fill="url(#gCost)"    />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
