"use client";
// src/components/DashboardCharts.tsx
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell
} from "recharts";

const ACCENT  = "#16c2a3";
const DANGER  = "#ff4d6d";
const BLUE    = "#60a5fa";
const AMBER   = "#f59e0b";
const PURPLE  = "#c084fc";
const COLORS  = [ACCENT, BLUE, PURPLE, AMBER, DANGER, "#34d399", "#fb923c", "#a78bfa"];

const card = {
  background: "rgba(18,18,22,.9)",
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 14, padding: "20px 22px"
} as const;

function fmt(n: number) { return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

const tooltipStyle = {
  contentStyle: { background: "#18181e", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, fontSize: 12 },
  labelStyle:   { color: "rgba(255,255,255,.7)" },
  itemStyle:    { color: "rgba(255,255,255,.85)" }
};

interface Props {
  kpi: { totalRevenue: number; totalCost: number; profit: number; avgMargin: number; totalPending: number; totalSales: number; closedSales: number; pendingSales: number; staleItems: number; stockCount: number };
  revenueByMonth: { month: string; ricavi: number; costi: number; profitto: number; vendite: number }[];
  topProducts: { name: string; ricavo: number; margine: number }[];
  byProfile: { name: string; ricavi: number; vendite: number }[];
  staleStock: { name: string; days: number; cost: number; profile: string }[];
  marginsByFascia: { fascia: string; margine: number; ricavi: number }[];
}

export default function DashboardCharts({ kpi, revenueByMonth, topProducts, byProfile, staleStock, marginsByFascia }: Props) {
  const { totalRevenue, totalCost, profit, avgMargin, totalPending, totalSales, closedSales, pendingSales, staleItems, stockCount } = kpi;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── KPI ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 14 }}>
        {[
          { label: "Totale vendite",  value: `€ ${fmt(totalRevenue + totalPending)}`, color: "#a78bfa", sub: `concluse + in sospeso` },
          { label: "Ricavi conclusi", value: `€ ${fmt(totalRevenue)}`, color: ACCENT, sub: `${closedSales} vendite` },
          { label: "Costi acquisti",  value: `€ ${fmt(totalCost)}`,    color: DANGER, sub: `${totalSales} totali` },
          { label: "Profitto netto",  value: `€ ${fmt(profit)}`,       color: profit >= 0 ? ACCENT : DANGER, sub: `margine medio ${avgMargin}%` },
          { label: "In sospeso",      value: String(pendingSales),      color: AMBER,  sub: "vendite aperte" },
          { label: "Stock magazzino", value: `${stockCount} art.`,      color: BLUE,   sub: `${staleItems} fermi >60gg` },
        ].map(({ label, value, color, sub }) => (
          <div key={label} style={{ ...card, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── RIGA 2: Grafico area + profilo ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>

        {/* Area chart ricavi/costi/profitto */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Ricavi e costi mensili</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 16 }}>Ultimi 8 mesi</div>
          {revenueByMonth.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,.3)", fontSize: 13, textAlign: "center", padding: "40px 0" }}>Nessun dato ancora</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueByMonth} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={ACCENT} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={ACCENT} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={DANGER} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={DANGER} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={BLUE} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={BLUE} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,.4)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [`€ ${fmt(v)}`]} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: "rgba(255,255,255,.5)" }} />
                <Area type="monotone" dataKey="ricavi"  name="Ricavi conclusi" stroke={ACCENT} strokeWidth={2} fill="url(#gR)" />
                <Area type="monotone" dataKey="costi"   name="Costi"           stroke={DANGER} strokeWidth={2} fill="url(#gC)" />
                <Area type="monotone" dataKey="totale"  name="Totale vendite"  stroke={AMBER}  strokeWidth={2} fill="url(#gP)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart per profilo */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Vendite per profilo</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 16 }}>Ricavi conclusi</div>
          {byProfile.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,.3)", fontSize: 13, textAlign: "center", padding: "40px 0" }}>Nessun dato</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byProfile} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,.4)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,.6)", fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [`€ ${fmt(v)}`]} />
                <Bar dataKey="ricavi" name="Ricavi" radius={[0, 6, 6, 0]}>
                  {byProfile.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── RIGA 3: Top prodotti + margini per fascia ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Top prodotti */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Top prodotti per ricavo</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 16 }}>Solo vendite concluse</div>
          {topProducts.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,.3)", fontSize: 13, textAlign: "center", padding: "40px 0" }}>Nessun dato</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,.4)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,.6)", fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip {...tooltipStyle} formatter={(v: number, name: string) => [name === "profitto" ? `€ ${fmt(v)}` : `${v}%`, name === "profitto" ? "Profitto" : "Margine"]} />
                <Bar dataKey="profitto" name="profitto" radius={[0, 6, 6, 0]}>
                  {topProducts.map((p, i) => (
                    <Cell key={i} fill={p.margine >= 100 ? ACCENT : p.margine >= 50 ? BLUE : AMBER} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Margini per fascia prezzo */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Margine % per fascia prezzo</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 16 }}>Quale fascia rende di più</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={marginsByFascia} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
              <XAxis dataKey="fascia" tick={{ fill: "rgba(255,255,255,.5)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,.4)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip {...tooltipStyle} formatter={(v: number, name: string) => [name === "margine" ? `${v}%` : `€ ${fmt(v)}`, name === "margine" ? "Margine" : "Ricavi"]} />
              <Bar dataKey="margine" name="margine" radius={[6, 6, 0, 0]}>
                {marginsByFascia.map((d, i) => (
                  <Cell key={i} fill={d.margine >= 100 ? ACCENT : d.margine >= 50 ? BLUE : AMBER} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── RIGA 4: Articoli fermi in magazzino ── */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Articoli fermi in magazzino</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 16 }}>Ordinati per giorni dal più vecchio</div>
        {staleStock.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,.3)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
            Nessun articolo fermo — ottimo! 🎉
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {staleStock.map((item, i) => {
              const pct = Math.min(100, Math.round((item.days / 180) * 100));
              const color = item.days > 120 ? DANGER : item.days > 60 ? AMBER : BLUE;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 120, fontSize: 12, color: "rgba(255,255,255,.7)", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.name}
                  </div>
                  <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,.08)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width .4s" }} />
                  </div>
                  <div style={{ width: 50, textAlign: "right", fontSize: 12, fontWeight: 600, color, flexShrink: 0 }}>
                    {item.days}gg
                  </div>
                  <div style={{ width: 55, textAlign: "right", fontSize: 12, color: "rgba(255,255,255,.4)", flexShrink: 0 }}>
                    €{item.cost.toFixed(0)}
                  </div>
                  <div style={{ width: 70, textAlign: "right", fontSize: 11, color: "rgba(255,255,255,.3)", flexShrink: 0 }}>
                    {item.profile}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
