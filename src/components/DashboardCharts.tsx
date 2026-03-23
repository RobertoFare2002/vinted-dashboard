"use client";
// src/components/DashboardCharts.tsx
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
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
  borderRadius: 14, padding: "16px 18px"
} as const;

function fmt(n: number) { return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

const tooltipStyle = {
  contentStyle: { background: "#18181e", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, fontSize: 11 },
  labelStyle:   { color: "rgba(255,255,255,.7)" },
  itemStyle:    { color: "rgba(255,255,255,.85)" }
};

interface Props {
  kpi: { totalRevenue: number; totalCost: number; profit: number; avgMargin: number; totalPending: number; totalSales: number; closedSales: number; pendingSales: number; staleItems: number; stockCount: number };
  revenueByMonth: { month: string; ricavi: number; costi: number; profitto: number; vendite: number }[];
  topProducts: { name: string; profitto: number; margine: number }[];
  byProfile: { name: string; ricavi: number; vendite: number }[];
  staleStock: { name: string; days: number; cost: number; profile: string }[];
  marginsByFascia: { fascia: string; margine: number; ricavi: number }[];
}

export default function DashboardCharts({ kpi, revenueByMonth, topProducts, byProfile, staleStock, marginsByFascia }: Props) {
  const { totalRevenue, totalCost, profit, avgMargin, totalPending, closedSales, pendingSales, staleItems, stockCount, totalSales } = kpi;

  const kpiItems = [
    { label: "Totale vendite",  value: `€ ${fmt(totalRevenue + totalPending)}`, color: "#a78bfa", sub: "concluse + in sospeso" },
    { label: "Ricavi conclusi", value: `€ ${fmt(totalRevenue)}`,                color: ACCENT,    sub: `${closedSales} vendite` },
    { label: "Costi acquisti",  value: `€ ${fmt(totalCost)}`,                   color: DANGER,    sub: `${totalSales} totali` },
    { label: "Profitto netto",  value: `€ ${fmt(profit)}`,                      color: profit >= 0 ? ACCENT : DANGER, sub: `margine ${avgMargin}%` },
    { label: "In sospeso",      value: String(pendingSales),                     color: AMBER,     sub: "vendite aperte" },
    { label: "Stock",           value: `${stockCount} art.`,                    color: BLUE,      sub: `${staleItems} fermi >60gg` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── KPI GRID: 2 col mobile, 3 col tablet, 6 col desktop ── */}
      <div className="kpi-grid">
        {kpiItems.map(({ label, value, color, sub }) => (
          <div key={label} style={{ ...card, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.45)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color, marginBottom: 3, lineHeight: 1.2 }}>{value}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Area chart ricavi/costi — full width su mobile ── */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Ricavi e costi mensili</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 14 }}>Ultimi 8 mesi</div>
        {revenueByMonth.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,.3)", fontSize: 12, textAlign: "center", padding: "32px 0" }}>Nessun dato ancora</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueByMonth} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
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
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,.4)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [`€ ${fmt(Number(v))}`]} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10, color: "rgba(255,255,255,.5)" }} />
              <Area type="monotone" dataKey="ricavi"  name="Ricavi" stroke={ACCENT} strokeWidth={2} fill="url(#gR)" />
              <Area type="monotone" dataKey="costi"   name="Costi"  stroke={DANGER} strokeWidth={2} fill="url(#gC)" />
              <Area type="monotone" dataKey="totale"  name="Totale" stroke={AMBER}  strokeWidth={2} fill="url(#gP)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── 2 grafici: su mobile in colonna, su desktop affiancati ── */}
      <div className="charts-2col">

        {/* Vendite per profilo */}
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Vendite per profilo</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 14 }}>Ricavi conclusi</div>
          {byProfile.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,.3)", fontSize: 12, textAlign: "center", padding: "32px 0" }}>Nessun dato</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={byProfile} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,.4)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,.6)", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [`€ ${fmt(Number(v))}`]} />
                <Bar dataKey="ricavi" name="Ricavi" radius={[0, 6, 6, 0]}>
                  {byProfile.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Margini per fascia */}
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Margine per fascia prezzo</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 14 }}>Quale fascia rende di più</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={marginsByFascia} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
              <XAxis dataKey="fascia" tick={{ fill: "rgba(255,255,255,.5)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,.4)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip {...tooltipStyle} formatter={(v: any, name: any) => [name === "margine" ? `${v}%` : `€ ${fmt(Number(v))}`, name === "margine" ? "Margine" : "Ricavi"]} />
              <Bar dataKey="margine" name="margine" radius={[6, 6, 0, 0]}>
                {marginsByFascia.map((d, i) => (
                  <Cell key={i} fill={d.margine >= 100 ? ACCENT : d.margine >= 50 ? BLUE : AMBER} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top prodotti — full width ── */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Top prodotti per profitto</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 14 }}>Solo vendite concluse</div>
        {topProducts.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,.3)", fontSize: 12, textAlign: "center", padding: "32px 0" }}>Nessun dato</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "rgba(255,255,255,.4)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,.6)", fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip {...tooltipStyle} formatter={(v: any, name: any) => [name === "profitto" ? `€ ${fmt(Number(v))}` : `${v}%`, name === "profitto" ? "Profitto" : "Margine"]} />
              <Bar dataKey="profitto" name="profitto" radius={[0, 6, 6, 0]}>
                {topProducts.map((p, i) => (
                  <Cell key={i} fill={p.margine >= 100 ? ACCENT : p.margine >= 50 ? BLUE : AMBER} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Articoli fermi ── */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Articoli fermi in magazzino</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 14 }}>Dal più vecchio</div>
        {staleStock.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,.3)", fontSize: 12, textAlign: "center", padding: "24px 0" }}>Nessun articolo fermo 🎉</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {staleStock.map((item, i) => {
              const pct   = Math.min(100, Math.round((item.days / 180) * 100));
              const color = item.days > 120 ? DANGER : item.days > 60 ? AMBER : BLUE;
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{item.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color, flexShrink: 0, marginLeft: 8 }}>{item.days}gg · €{item.cost.toFixed(0)}</span>
                  </div>
                  <div style={{ height: 5, background: "rgba(255,255,255,.08)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .charts-2col {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .kpi-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1024px) {
          .kpi-grid    { grid-template-columns: repeat(6, 1fr); gap: 14px; }
          .charts-2col { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}
