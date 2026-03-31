"use client";
// src/components/DashboardCharts.tsx
import { useState, useMemo } from "react";
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
const C = { bg:"rgba(255,255,255,.03)", border:"rgba(255,255,255,.08)" };

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits:2, maximumFractionDigits:2 });
}

const TT = {
  contentStyle: { background:"#131920", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, fontSize:11 },
  labelStyle:   { color:"rgba(255,255,255,.5)", fontSize:10 },
  itemStyle:    { color:"rgba(255,255,255,.85)" },
  cursor:       { fill:"rgba(255,255,255,.04)" },
};

const MONTHS = [
  ["01","Gennaio"],["02","Febbraio"],["03","Marzo"],["04","Aprile"],
  ["05","Maggio"],["06","Giugno"],["07","Luglio"],["08","Agosto"],
  ["09","Settembre"],["10","Ottobre"],["11","Novembre"],["12","Dicembre"],
] as const;

interface Props {
  sales:    any[];
  stock:    any[];
  profiles: { id: string; name: string }[];
}

export default function DashboardCharts({ sales, stock, profiles }: Props) {
  const [filterProfile, setFilterProfile] = useState("");
  const [filterYear,    setFilterYear]    = useState("");
  const [filterMonth,   setFilterMonth]   = useState("");

  const profileNamesMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of profiles) m[p.id] = p.name;
    return m;
  }, [profiles]);

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const s of sales) {
      const y = String(s.transaction_date ?? "").slice(0, 4);
      if (y.length === 4) set.add(y);
    }
    return Array.from(set).sort().reverse();
  }, [sales]);

  const filteredSales = useMemo(() => {
    let list = sales;
    if (filterProfile) {
      const profileName = profiles.find(p => p.id === filterProfile)?.name ?? "";
      list = list.filter(s => s.profile_id === filterProfile || s.profile_id === profileName);
    }
    if (filterYear)  list = list.filter(s => String(s.transaction_date ?? "").slice(0, 4) === filterYear);
    if (filterMonth) list = list.filter(s => String(s.transaction_date ?? "").slice(5, 7) === filterMonth);
    return list;
  }, [sales, filterProfile, filterYear, filterMonth, profiles]);

  const filteredStock = useMemo(() => {
    if (!filterProfile) return stock;
    const profileName = profiles.find(p => p.id === filterProfile)?.name ?? "";
    return stock.filter(i => i.profile_id === filterProfile || i.profile_id === profileName);
  }, [stock, filterProfile, profiles]);

  const nowTs   = Date.now();
  const closed  = filteredSales.filter(s => s.status === "closed");
  const open    = filteredSales.filter(s => s.status === "open");

  const totalRevenue = closed.reduce((a: number, s: any) => a + Number(s.amount ?? 0), 0);
  const totalCost    = filteredSales.reduce((a: number, s: any) => a + Number(s.cost ?? 0), 0);
  const totalPending = open.reduce((a: number, s: any) => a + Number(s.amount ?? 0), 0);
  const profit       = totalRevenue - totalCost;
  const avgMargin    = totalCost > 0 ? Math.round(((totalRevenue - totalCost) / totalCost) * 100) : 0;
  const staleItems   = filteredStock.filter((i: any) => i.purchased_at && i.status === "available" && Math.floor((nowTs - new Date(i.purchased_at).getTime()) / 86400000) > 60).length;
  const stockCount   = filteredStock.filter((i: any) => i.status === "available").length;

  const revenueByMonth = useMemo(() => {
    type M = { revenue: number; cost: number; count: number; total: number };
    const map: Record<string, M> = {};
    for (const s of filteredSales) {
      const m = String(s.transaction_date ?? "").slice(0, 7);
      if (!m) continue;
      if (!map[m]) map[m] = { revenue: 0, cost: 0, count: 0, total: 0 };
      if (s.status === "closed") map[m].revenue += Number(s.amount ?? 0);
      map[m].total += Number(s.amount ?? 0);
      map[m].cost  += Number(s.cost   ?? 0);
      map[m].count += 1;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([month, v]) => ({
        month:    new Date(month + "-01").toLocaleDateString("it", { month: "short", year: "2-digit" }),
        ricavi:   +v.revenue.toFixed(2),
        costi:    +v.cost.toFixed(2),
        totale:   +v.total.toFixed(2),
        profitto: +(v.revenue - v.cost).toFixed(2),
        vendite:  v.count,
      }));
  }, [filteredSales]);

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; cost: number; count: number }> = {};
    for (const s of closed) {
      const key = String(s.buyer_seller || "Sconosciuto").trim();
      if (!map[key]) map[key] = { name: key, revenue: 0, cost: 0, count: 0 };
      map[key].revenue += Number(s.amount ?? 0);
      map[key].cost    += Number(s.cost   ?? 0);
      map[key].count   += 1;
    }
    return Object.values(map)
      .sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost))
      .slice(0, 8)
      .map(p => ({
        name:     p.name.length > 22 ? p.name.slice(0, 22) + "…" : p.name,
        profitto: +(p.revenue - p.cost).toFixed(2),
        margine:  p.cost > 0 ? Math.round(((p.revenue - p.cost) / p.cost) * 100) : 0,
      }));
  }, [closed]);

  const byProfile = useMemo(() => {
    const map: Record<string, { revenue: number; count: number }> = {};
    for (const s of closed) {
      const pid  = String(s.profile_id || "Nessuno");
      const name = profileNamesMap[pid] ?? pid;
      if (!map[name]) map[name] = { revenue: 0, count: 0 };
      map[name].revenue += Number(s.amount ?? 0);
      map[name].count   += 1;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .map(([name, v]) => ({ name, ricavi: +v.revenue.toFixed(2), vendite: v.count }));
  }, [closed, profileNamesMap]);

  const staleStock = useMemo(() => {
    return filteredStock
      .filter((i: any) => i.purchased_at && i.status === "available")
      .map((i: any) => ({
        name:    String(i.name || "—").slice(0, 28),
        days:    Math.floor((nowTs - new Date(i.purchased_at).getTime()) / 86400000),
        cost:    Number(i.purchase_price ?? 0),
        profile: profileNamesMap[i.profile_id] ?? String(i.profile_id || "—").slice(0, 12),
      }))
      .sort((a: any, b: any) => b.days - a.days)
      .slice(0, 8);
  }, [filteredStock, profileNamesMap, nowTs]);

  const marginsByFascia = useMemo(() => {
    const fasceMap: Record<string, { revenue: number; cost: number }> = {
      "0–20€":   { revenue: 0, cost: 0 },
      "20–50€":  { revenue: 0, cost: 0 },
      "50–100€": { revenue: 0, cost: 0 },
      "100€+":   { revenue: 0, cost: 0 },
    };
    for (const s of closed) {
      const amt = Number(s.amount ?? 0);
      const cst = Number(s.cost   ?? 0);
      const key = amt < 20 ? "0–20€" : amt < 50 ? "20–50€" : amt < 100 ? "50–100€" : "100€+";
      fasceMap[key].revenue += amt;
      fasceMap[key].cost    += cst;
    }
    return Object.entries(fasceMap).map(([fascia, v]) => ({
      fascia,
      margine: v.cost > 0 ? Math.round(((v.revenue - v.cost) / v.cost) * 100) : 0,
      ricavi:  +v.revenue.toFixed(2),
    }));
  }, [closed]);

  const kpiItems = [
    { label:"Totale vendite",  value:`€${fmt(totalRevenue+totalPending)}`, color:PURPLE, sub:"concluse + sospeso" },
    { label:"N° Vendite",      value:String(closed.length),                color:ACCENT, sub:`${filteredSales.length} tot · €${fmt(totalRevenue)}` },
    { label:"Costi acquisti",  value:`€${fmt(totalCost)}`,                 color:DANGER, sub:`${filteredSales.length} totali` },
    { label:"Profitto netto",  value:`€${fmt(profit)}`,                    color:profit>=0?ACCENT:DANGER, sub:`margine ${avgMargin}%` },
    { label:"In sospeso",      value:String(open.length),                  color:AMBER,  sub:"vendite aperte" },
    { label:"Stock",           value:`${stockCount} art.`,                 color:BLUE,   sub:`${staleItems} fermi >60gg` },
  ];

  const selStyle: React.CSSProperties = {
    padding: "9px 12px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.045)",
    color: "rgba(255,255,255,.55)", fontSize: 12, outline: "none",
    fontFamily: "inherit", colorScheme: "dark", cursor: "pointer",
  };
  const selActiveStyle: React.CSSProperties = {
    ...selStyle,
    border: "1px solid rgba(0,229,195,.3)",
    background: "rgba(0,229,195,.08)",
    color: ACCENT,
  };
  const hasFilter = !!(filterProfile || filterYear || filterMonth);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>

      {/* Filter bar */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:4 }}>
        <select value={filterProfile} onChange={e => setFilterProfile(e.target.value)}
          style={filterProfile ? selActiveStyle : selStyle}>
          <option value="">Tutti i profili</option>
          {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterYear} onChange={e => { setFilterYear(e.target.value); if (!e.target.value) setFilterMonth(""); }}
          style={filterYear ? selActiveStyle : selStyle}>
          <option value="">Tutti gli anni</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {filterYear && (
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            style={filterMonth ? selActiveStyle : selStyle}>
            <option value="">Tutti i mesi</option>
            {MONTHS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        )}
        {hasFilter && (
          <button onClick={() => { setFilterProfile(""); setFilterYear(""); setFilterMonth(""); }}
            style={{ padding:"9px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,.1)", background:"transparent", color:"rgba(255,255,255,.4)", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
            ✕ Reset
          </button>
        )}
      </div>

      {/* KPI grid */}
      <div className="kpi-grid">
        {kpiItems.map(({label,value,color,sub})=>(
          <div key={label} style={{background:C.bg,border:`1px solid ${C.border}`,borderBottom:`2px solid ${color}`,borderRadius:14,padding:"14px 14px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:48,background:`linear-gradient(to top, ${color}14, transparent)`,pointerEvents:"none"}} />
            <div style={{fontSize:9,color:"rgba(255,255,255,.4)",marginBottom:6,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700}}>{label}</div>
            <div style={{fontSize:20,fontWeight:900,color,lineHeight:1,marginBottom:4,letterSpacing:"-.03em"}}>{value}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Area chart */}
      <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 14px 12px"}}>
        <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:12}}>
          <span style={{fontSize:14,fontWeight:700}}>Ricavi e costi mensili</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,.35)"}}>Ultimi 8 mesi</span>
        </div>
        {revenueByMonth.length===0 ? (
          <div style={{color:"rgba(255,255,255,.25)",fontSize:12,textAlign:"center",padding:"32px 0"}}>Nessun dato ancora</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revenueByMonth} margin={{top:4,right:4,left:-24,bottom:0}}>
              <defs>
                <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ACCENT} stopOpacity={0.35}/><stop offset="95%" stopColor={ACCENT} stopOpacity={0}/></linearGradient>
                <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={DANGER} stopOpacity={0.25}/><stop offset="95%" stopColor={DANGER} stopOpacity={0}/></linearGradient>
                <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={AMBER}  stopOpacity={0.2}/><stop offset="95%" stopColor={AMBER}  stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
              <XAxis dataKey="month" tick={{fill:"rgba(255,255,255,.35)",fontSize:10}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:"rgba(255,255,255,.35)",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`€${v}`} />
              <Tooltip {...TT} formatter={(v:any)=>[`€ ${fmt(Number(v))}`]} />
              <Legend wrapperStyle={{fontSize:11,paddingTop:10,color:"rgba(255,255,255,.45)"}} />
              <Area type="monotone" dataKey="ricavi" name="Ricavi" stroke={ACCENT} strokeWidth={2} fill="url(#gR)" dot={false} />
              <Area type="monotone" dataKey="costi"  name="Costi"  stroke={DANGER} strokeWidth={2} fill="url(#gC)" dot={false} />
              <Area type="monotone" dataKey="totale" name="Totale" stroke={AMBER}  strokeWidth={1.5} fill="url(#gT)" strokeDasharray="4 2" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 2 grafici */}
      <div className="charts-2col">
        <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 14px 12px"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:12}}>
            <span style={{fontSize:13,fontWeight:700}}>Vendite per profilo</span>
          </div>
          {byProfile.length===0 ? (
            <div style={{color:"rgba(255,255,255,.25)",fontSize:12,textAlign:"center",padding:"32px 0"}}>Nessun dato</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={byProfile} layout="vertical" margin={{top:0,right:12,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" horizontal={false} />
                <XAxis type="number" tick={{fill:"rgba(255,255,255,.35)",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`€${v}`} />
                <YAxis type="category" dataKey="name" tick={{fill:"rgba(255,255,255,.65)",fontSize:11,fontWeight:600}} axisLine={false} tickLine={false} width={80} />
                <Tooltip {...TT} formatter={(v:any)=>[`€ ${fmt(Number(v))}`]} />
                <Bar dataKey="ricavi" name="Ricavi" radius={[0,6,6,0]} maxBarSize={20}>
                  {byProfile.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 14px 12px"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:12}}>
            <span style={{fontSize:13,fontWeight:700}}>Margine per fascia</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={marginsByFascia} margin={{top:4,right:4,left:-24,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
              <XAxis dataKey="fascia" tick={{fill:"rgba(255,255,255,.45)",fontSize:9}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:"rgba(255,255,255,.35)",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
              <Tooltip {...TT} formatter={(v:any,name:any)=>[name==="margine"?`${v}%`:`€ ${fmt(Number(v))}`,name==="margine"?"Margine":"Ricavi"]} />
              <Bar dataKey="margine" name="margine" radius={[6,6,0,0]} maxBarSize={44}>
                {marginsByFascia.map((d,i)=><Cell key={i} fill={d.margine>=100?ACCENT:d.margine>=50?BLUE:AMBER} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top prodotti */}
      <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 14px 12px"}}>
        <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:12}}>
          <span style={{fontSize:13,fontWeight:700}}>Top prodotti per profitto</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,.35)"}}>vendite concluse</span>
        </div>
        {topProducts.length===0 ? (
          <div style={{color:"rgba(255,255,255,.25)",fontSize:12,textAlign:"center",padding:"32px 0"}}>Nessun dato</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProducts} layout="vertical" margin={{top:0,right:40,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" horizontal={false} />
              <XAxis type="number" tick={{fill:"rgba(255,255,255,.35)",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`€${v}`} />
              <YAxis type="category" dataKey="name" tick={{fill:"rgba(255,255,255,.6)",fontSize:10}} axisLine={false} tickLine={false} width={100} />
              <Tooltip {...TT} formatter={(v:any,name:any)=>[name==="profitto"?`€ ${fmt(Number(v))}`:`${v}%`,name==="profitto"?"Profitto":"Margine"]} />
              <Bar dataKey="profitto" name="profitto" radius={[0,6,6,0]} maxBarSize={18}>
                {topProducts.map((p,i)=><Cell key={i} fill={p.margine>=100?ACCENT:p.margine>=50?BLUE:AMBER} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Articoli fermi */}
      {staleStock.length > 0 && (
        <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 14px 16px"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:14}}>
            <span style={{fontSize:13,fontWeight:700}}>Articoli fermi</span>
            <span style={{fontSize:11,color:"rgba(255,255,255,.35)"}}>dal più vecchio</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {staleStock.map((item: any,i: number)=>{
              const pct   = Math.min(100,Math.round((item.days/180)*100));
              const color = item.days>120?DANGER:item.days>60?AMBER:BLUE;
              return (
                <div key={i}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                    <div style={{overflow:"hidden",flex:1,minWidth:0}}>
                      <div style={{fontSize:12,color:"rgba(255,255,255,.75)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                      {item.profile&&item.profile!=="—"&&<div style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>{item.profile}</div>}
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color,flexShrink:0,marginLeft:12}}>{item.days}gg · €{item.cost.toFixed(0)}</span>
                  </div>
                  <div style={{height:4,background:"rgba(255,255,255,.06)",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:2}} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .kpi-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
        .charts-2col { display:grid; grid-template-columns:1fr; gap:12px; }
        @media(min-width:640px) { .kpi-grid { grid-template-columns:repeat(3,1fr); } }
        @media(min-width:1024px) { .kpi-grid { grid-template-columns:repeat(6,1fr); gap:12px; } .charts-2col { grid-template-columns:1fr 1fr; } }
      `}</style>
    </div>
  );
}
