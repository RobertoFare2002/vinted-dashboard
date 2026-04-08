"use client";
// src/components/SalesChartCard.tsx
import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";

const V    = "#007782";
const V_L  = "rgba(0,119,130,0.15)";
const INK  = "var(--ink)";
const SL   = "var(--slate)";
const BD   = "var(--border)";
const W    = "var(--white)";

type SaleRow = { status?: string; transaction_date?: string };
type View    = "week" | "month" | "year";

const MONTH_NAMES = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const MONTH_SHORT = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];

// Weeks of a month: each week starts on Monday.
// We find the Monday on or before day 1, then iterate 7 days at a time.
// Labels show actual start/end day of the week (even if outside the month).
function getMonthWeeks(year: number, month: number): { label: string; monday: Date }[] {
  const firstOfMonth = new Date(year, month, 1);
  const dayOfWeek    = (firstOfMonth.getDay() + 6) % 7; // 0=Mon..6=Sun
  const firstMonday  = new Date(year, month, 1 - dayOfWeek);

  const weeks: { label: string; monday: Date }[] = [];
  let cursor = new Date(firstMonday);

  while (true) {
    const sunday = new Date(cursor);
    sunday.setDate(sunday.getDate() + 6);

    // Stop if this week starts after the last day of the month
    if (cursor.getFullYear() > year || (cursor.getFullYear() === year && cursor.getMonth() > month)) break;

    const pad = (n: number) => String(n).padStart(2, "0");
    // Show actual calendar dates (e.g. 28-04 for a week starting in previous month)
    const label = `${pad(cursor.getDate())}-${pad(sunday.getDate())}`;
    weeks.push({ label, monday: new Date(cursor) });

    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}

function buildData(sales: SaleRow[], view: View, monthOffset: number, yearOffset: number) {
  const now = new Date();

  if (view === "week") {
    const counts = [0,0,0,0,0,0,0];
    const DAY_LABELS = ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];
    sales.forEach(s => {
      if (!s.transaction_date) return;
      const d    = new Date(s.transaction_date);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diff < 7) counts[(d.getDay() + 6) % 7]++;
    });
    return {
      items: DAY_LABELS.map((label, i) => ({ label, value: counts[i] })),
      total: counts.reduce((a, b) => a + b, 0),
    };
  }

  if (view === "month") {
    const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const y = target.getFullYear(), m = target.getMonth();
    const weeks = getMonthWeeks(y, m);
    const counts = new Array(weeks.length).fill(0);

    sales.forEach(s => {
      if (!s.transaction_date) return;
      const d = new Date(s.transaction_date);
      for (let i = 0; i < weeks.length; i++) {
        const wStart = weeks[i].monday;
        const wEnd   = new Date(wStart);
        wEnd.setDate(wEnd.getDate() + 6);
        wEnd.setHours(23, 59, 59);
        if (d >= wStart && d <= wEnd) { counts[i]++; break; }
      }
    });

    return {
      items: weeks.map((w, i) => ({ label: w.label, value: counts[i] })),
      total: counts.reduce((a, b) => a + b, 0),
    };
  }

  // year
  const y = now.getFullYear() + yearOffset;
  const counts = new Array(12).fill(0);
  sales.forEach(s => {
    if (!s.transaction_date) return;
    const d = new Date(s.transaction_date);
    if (d.getFullYear() === y) counts[d.getMonth()]++;
  });
  return {
    items: MONTH_SHORT.map((label, i) => ({ label, value: counts[i] })),
    total: counts.reduce((a, b) => a + b, 0),
  };
}

function getPeriodLabel(view: View, monthOffset: number, yearOffset: number) {
  const now = new Date();
  if (view === "week") return "Ultimi 7 giorni";
  if (view === "month") {
    const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    return MONTH_NAMES[d.getMonth()] + " " + d.getFullYear();
  }
  return String(now.getFullYear() + yearOffset);
}

const VIEW_LABELS: Record<View, string> = {
  week:  "Vendite · settimana",
  month: "Vendite · mese",
  year:  "Vendite · anno",
};

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: INK, border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#fff" }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ color: "rgba(255,255,255,0.75)" }}>{payload[0].value} vendite</div>
    </div>
  );
}

export type PeriodState = { view: View; monthOffset: number; yearOffset: number };

export default function SalesChartCard({ sales, onPeriodChange }: { sales: SaleRow[]; onPeriodChange?: (p: PeriodState) => void }) {
  const [view,        setView]        = useState<View>("year");
  const [monthOffset, setMonthOffset] = useState(0);
  const [yearOffset,  setYearOffset]  = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Notify parent whenever period changes
  useEffect(() => {
    onPeriodChange?.({ view, monthOffset, yearOffset });
  }, [view, monthOffset, yearOffset]); // eslint-disable-line react-hooks/exhaustive-deps

  const { items, total } = useMemo(
    () => buildData(sales, view, monthOffset, yearOffset),
    [sales, view, monthOffset, yearOffset]
  );

  // Reset selection when view/period changes
  const displayTotal = selectedIdx !== null ? (items[selectedIdx]?.value ?? total) : total;
  const displayLabel = selectedIdx !== null ? items[selectedIdx]?.label : null;

  const maxVal      = Math.max(...items.map(i => i.value), 1);
  const hasPrev     = view !== "week";
  const hasNext     = view === "month" ? monthOffset < 0 : view === "year" ? yearOffset < 0 : false;
  const periodLabel = getPeriodLabel(view, monthOffset, yearOffset);

  function handlePrev() {
    if (view === "month") { setMonthOffset(o => o - 1); setSelectedIdx(null); }
    if (view === "year")  { setYearOffset(o => o - 1);  setSelectedIdx(null); }
  }
  function handleNext() {
    if (view === "month" && monthOffset < 0) { setMonthOffset(o => o + 1); setSelectedIdx(null); }
    if (view === "year"  && yearOffset  < 0) { setYearOffset(o => o + 1);  setSelectedIdx(null); }
  }
  function handleView(v: View) {
    setView(v);
    setMonthOffset(0);
    setYearOffset(0);
    setSelectedIdx(null);
  }
  return (
    <>
      <style>{`
        .scc-root { background:var(--white); border-radius:20px; border:1px solid var(--border); box-shadow:0 4px 20px rgba(0,0,0,0.06); transition:background .35s, border-color .25s; padding:24px 24px 16px; display:flex; flex-direction:column; }
        .scc-root .recharts-bar-rectangle path { stroke: none !important; stroke-width: 0 !important; }
        .scc-root .recharts-bar-rectangle { stroke: none !important; stroke-width: 0 !important; }
        .scc-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; flex-wrap:wrap; gap:6px; }
        .scc-title { font-size:11px; font-weight:600; color:var(--slate); text-transform:uppercase; letter-spacing:.06em; }
        .scc-nav { display:flex; align-items:center; gap:4px; }
        .scc-nav-btn { width:22px; height:22px; border-radius:50%; border:1px solid var(--border); background:var(--white); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background .15s; padding:0; }
        .scc-nav-btn:hover:not(:disabled) { background:#f5f5f5; }
        .scc-nav-btn:disabled { opacity:0.25; cursor:default; }
        .scc-period { font-size:11px; font-weight:500; color:var(--ink); min-width:90px; text-align:center; }
        .scc-value { font-size:32px; font-weight:800; color:var(--ink); letter-spacing:-.04em; line-height:1.1; margin-bottom:2px; transition: all .15s; }
        .scc-sub { font-size:12px; color:${V}; margin-bottom:14px; }
        .scc-dots { display:flex; justify-content:center; align-items:center; gap:10px; margin-top:14px; }
        .scc-dot { border-radius:50%; cursor:pointer; border:none; padding:0; display:block; transition:all .18s ease; }
        .scc-bar { cursor:pointer; }
      `}</style>

      <div className="scc-root">
        <div className="scc-header">
          <span className="scc-title">{VIEW_LABELS[view]}</span>
          <div className="scc-nav">
            <button className="scc-nav-btn" onClick={handlePrev} disabled={!hasPrev}>
              <ChevronLeft size={12} color={INK} />
            </button>
            <span className="scc-period">{periodLabel}</span>
            <button className="scc-nav-btn" onClick={handleNext} disabled={!hasNext}>
              <ChevronRight size={12} color={INK} />
            </button>
          </div>
        </div>

        <div className="scc-value">{displayTotal}</div>
        <div className="scc-sub">
          {selectedIdx !== null
            ? <>settimana <strong>{displayLabel}</strong></>
            : "vendite nel periodo"
          }
        </div>

        <ResponsiveContainer width="100%" height={120}>
          <BarChart
            data={items}
            barCategoryGap={view === "year" ? "25%" : "30%"}
            margin={{ top: 4, right: 0, left: -24, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: view === "year" ? 9 : 10, fill: "rgba(136,136,136,0.7)" }}
              interval={view === "year" ? 1 : 0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "rgba(136,136,136,0.55)" }}
              allowDecimals={false}
              width={28}
              tickCount={4}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,119,130,0.04)" }} />
            <Bar dataKey="value" radius={[3,3,0,0]} isAnimationActive={false}
              stroke="none" strokeWidth={0}
              onClick={(_data, index) => setSelectedIdx(prev => prev === index ? null : index)}
              style={{ cursor: "pointer" }}
            >
              {items.map((entry, i) => {
                const isSelected = selectedIdx === i;
                const hasSelection = selectedIdx !== null;
                const isMax = entry.value === maxVal && maxVal > 0;
                // If nothing selected: max=full, others=light
                // If something selected: only selected=full Vinted, all others=very light
                let fill: string;
                if (hasSelection) {
                  fill = isSelected ? V : "rgba(0,119,130,0.10)";
                } else {
                  fill = isMax ? V : V_L;
                }
                return (
                  <Cell key={i} fill={fill} stroke="none" strokeWidth={0} />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="scc-dots">
          {(["week","month","year"] as View[]).map(v => (
            <button key={v} className="scc-dot" onClick={() => handleView(v)}
              style={{
                width:      view === v ? "10px" : "7px",
                height:     view === v ? "10px" : "7px",
                background: view === v ? INK : "rgba(0,0,0,0.18)",
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
