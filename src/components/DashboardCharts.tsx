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

interface Props {
  kpi: { totalRevenue:number; totalCost:number; profit:number; avgMargin:number; totalPending:number; totalSales:number; closedSales:number; pendingSales:number; staleItems:number; stockCount:number };
  revenueByMonth:  { month:string; ricavi:number; costi:number; profitto:number; vendite:number }[];
  topProducts:     { name:string; profitto:number; margine:number }[];
  byProfile:       { name:string; ricavi:number; vendite:number }[];
  staleStock:      { name:string; days:number; cost:number; profile:string }[];
  marginsByFascia: { fascia:string; margine:number; ricavi:number }[];
}

export default function DashboardCharts({ kpi, revenueByMonth, topProducts, byProfile, staleStock, marginsByFascia }: Props) {
  const { totalRevenue, totalCost, profit, avgMargin, totalPending, closedSales, pendingSales, staleItems, stockCount, totalSales } = kpi;

  const kpiItems = [
    { label:"Totale vendite",  value:`€${fmt(totalRevenue+totalPending)}`, color:PURPLE, sub:"concluse + sospeso" },
    { label:"Ricavi conclusi", value:`€${fmt(totalRevenue)}`,              color:ACCENT, sub:`${closedSales} vendite` },
    { label:"Costi acquisti",  value:`€${fmt(totalCost)}`,                 color:DANGER, sub:`${totalSales} totali` },
    { label:"Profitto netto",  value:`€${fmt(profit)}`,                    color:profit>=0?ACCENT:DANGER, sub:`margine ${avgMargin}%` },
    { label:"In sospeso",      value:String(pendingSales),                 color:AMBER,  sub:"vendite aperte" },
    { label:"Stock",           value:`${stockCount} art.`,                 color:BLUE,   sub:`${staleItems} fermi >60gg` },
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>

      {/* KPI grid — 2 col mobile, 3 tablet, 6 desktop */}
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
            {staleStock.map((item,i)=>{
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
