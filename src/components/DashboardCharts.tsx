"use client";
// src/components/DashboardCharts.tsx
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell
} from "recharts";

const ACCENT = "#16c2a3";
const DANGER = "#ff4d6d";
const BLUE   = "#4f8ef7";
const AMBER  = "#f59e0b";
const PURPLE = "#a78bfa";
const COLORS = [ACCENT, BLUE, PURPLE, AMBER, DANGER, "#34d399", "#fb923c", "#818cf8"];

const BG_CARD  = "rgba(255,255,255,.03)";
const BG_DEEP  = "#0d1117";
const BORDER   = "rgba(255,255,255,.08)";

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const tooltipStyle = {
  contentStyle: { background: "#131920", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, fontSize: 11, color: "rgba(255,255,255,.85)" },
  labelStyle:   { color: "rgba(255,255,255,.5)", fontSize: 10 },
  itemStyle:    { color: "rgba(255,255,255,.85)" },
  cursor:       { fill: "rgba(255,255,255,.04)" },
};

interface Props {
  kpi: {
    totalRevenue: number; totalCost: number; profit: number; avgMargin: number;
    totalPending: number; totalSales: number; closedSales: number;
    pendingSales: number; staleItems: number; stockCount: number;
  };
  revenueByMonth:  { month: string; ricavi: number; costi: number; profitto: number; vendite: number }[];
  topProducts:     { name: string; profitto: number; margine: number }[];
  byProfile:       { name: string; ricavi: number; vendite: number }[];
  staleStock:      { name: string; days: number; cost: number; profile: string }[];
  marginsByFascia: { fascia: string; margine: number; ricavi: number }[];
}

export default function DashboardCharts({ kpi, revenueByMonth, topProducts, byProfile, staleStock, marginsByFascia }: Props) {
  const { totalRevenue, totalCost, profit, avgMargin, totalPending, closedSales, pendingSales, staleItems, stockCount, totalSales } = kpi;

  const kpiItems = [
    { label: "Totale vendite",  value: `€${fmt(totalRevenue + totalPending)}`, color: PURPLE, accent: "#7c3aed", sub: "concluse + in sospeso" },
    { label: "Ricavi conclusi", value: `€${fmt(totalRevenue)}`,                color: ACCENT, accent: "#0e9e84", sub: `${closedSales} vendite` },
    { label: "Costi acquisti",  value: `€${fmt(totalCost)}`,                   color: DANGER, accent: "#cc1a3f", sub: `${totalSales} totali` },
    { label: "Profitto netto",  value: `€${fmt(profit)}`,                      color: profit >= 0 ? ACCENT : DANGER, accent: profit >= 0 ? "#0e9e84" : "#cc1a3f", sub: `margine ${avgMargin}%` },
    { label: "In sospeso",      value: String(pendingSales),                   color: AMBER,  accent: "#b45309", sub: "vendite aperte" },
    { label: "Stock",           value: `${stockCount} art.`,                   color: BLUE,   accent: "#1d4ed8", sub: `${staleItems} fermi >60gg` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── KPI GRID ── */}
      <div className="kpi-grid">
        {kpiItems.map(({ label, value, color, accent, sub }) => (
          <div key={label} style={{
            background: BG_CARD,
            border: `1px solid ${BORDER}`,
            borderBottom: `2px solid ${color}`,
            borderRadius: 14,
            padding: "16px 18px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* glow subtile */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
              background: `linear-gradient(to top, ${accent}18, transparent)`,
              pointerEvents: "none",
            }} />
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1, marginBottom: 5, letterSpacing: "-.02em" }}>{value}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Area chart ── */}
      <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 18px 14px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Ricavi e costi mensili</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>Ultimi 8 mesi</span>
        </div>
        {revenueByMonth.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,.25)", fontSize: 12, textAlign: "center", padding: "36px 0" }}>Nessun dato ancora</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueByMonth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={ACCENT} stopOpacity={0.35}/>
                  <stop offset="95%" stopColor={ACCENT} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={DANGER} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={DANGER} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={AMBER} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={AMBER} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,.35)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,.35)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [`€ ${fmt(Number(v))}`]} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, color: "rgba(255,255,255,.45)" }} />
              <Area type="monotone" dataKey="ricavi" name="Ricavi" stroke={ACCENT} strokeWidth={2} fill="url(#gR)" dot={false} />
              <Area type="monotone" dataKey="costi"  name="Costi"  stroke={DANGER} strokeWidth={2} fill="url(#gC)" dot={false} />
              <Area type="monotone" dataKey="totale" name="Totale" stroke={AMBER}  strokeWidth={1.5} fill="url(#gT)" strokeDasharray="4 2" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── 2 grafici affiancati ── */}
      <div className="charts-2col">
        <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 18px 14px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Vendite per profilo</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>Ricavi conclusi</span>
          </div>
          {byProfile.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,.25)", fontSize: 12, textAlign: "center", padding: "36px 0" }}>Nessun dato</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={byProfile} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,.35)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,.6)", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [`€ ${fmt(Number(v))}`]} />
                <Bar dataKey="ricavi" name="Ricavi" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {byProfile.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 18px 14px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Margine per fascia prezzo</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>Quale fascia rende di più</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={marginsByFascia} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
              <XAxis dataKey="fascia" tick={{ fill: "rgba(255,255,255,.45)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,.35)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip {...tooltipStyle} formatter={(v: any, name: any) => [name === "margine" ? `${v}%` : `€ ${fmt(Number(v))}`, name === "margine" ? "Margine" : "Ricavi"]} />
              <Bar dataKey="margine" name="margine" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {marginsByFascia.map((d, i) => (
                  <Cell key={i} fill={d.margine >= 100 ? ACCENT : d.margine >= 50 ? BLUE : AMBER} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top prodotti ── */}
      <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 18px 14px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Top prodotti per profitto</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>Solo vendite concluse</span>
        </div>
        {topProducts.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,.25)", fontSize: 12, textAlign: "center", padding: "36px 0" }}>Nessun dato</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "rgba(255,255,255,.35)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,.6)", fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip {...tooltipStyle} formatter={(v: any, name: any) => [name === "profitto" ? `€ ${fmt(Number(v))}` : `${v}%`, name === "profitto" ? "Profitto" : "Margine"]} />
              <Bar dataKey="profitto" name="profitto" radius={[0, 6, 6, 0]} maxBarSize={20}>
                {topProducts.map((p, i) => (
                  <Cell key={i} fill={p.margine >= 100 ? ACCENT : p.margine >= 50 ? BLUE : AMBER} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Articoli fermi ── */}
      <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 18px 16px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Articoli fermi in magazzino</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>Dal più vecchio</span>
        </div>
        {staleStock.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,.25)", fontSize: 12, textAlign: "center", padding: "24px 0" }}>Nessun articolo fermo 🎉</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {staleStock.map((item, i) => {
              const pct   = Math.min(100, Math.round((item.days / 180) * 100));
              const color = item.days > 120 ? DANGER : item.days > 60 ? AMBER : BLUE;
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                      {item.profile && item.profile !== "—" && (
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)", flexShrink: 0 }}>{item.profile}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color, flexShrink: 0, marginLeft: 12 }}>{item.days}gg · €{item.cost.toFixed(0)}</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width .3s" }} />
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
          gap: 14px;
        }
        @media (min-width: 640px) {
          .kpi-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1024px) {
          .kpi-grid    { grid-template-columns: repeat(6, 1fr); gap: 12px; }
          .charts-2col { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}
