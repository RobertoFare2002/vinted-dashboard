"use client";
// src/components/SalesClient.tsx
import { useState, useMemo, useTransition } from "react";
import { deleteSale, changeSaleStatus } from "@/app/(dashboard)/sales/actions";
import { cancelSale, concludeSale } from "@/app/(dashboard)/stock/actions";
import SaleModal from "@/components/SaleModal";

type SaleRow = {
  id: string; buyer_seller: string | null; amount: number | null; cost: number | null;
  platform: string | null; status: string | null; notes: string | null;
  transaction_date: string | null; template_id_ext: string | null;
  profile_id: string | null; raw_data: { stock_id?: string } | null;
};
type Template = { id: string; name: string };
type Props = {
  initialSales: SaleRow[];
  templates:    Template[];
  photoMap:     Record<string, string>;
  profileMap:   Record<string, string>;
};

const STATUS_META = {
  open:   { label:"In sospeso", color:"#f59e0b", bg:"rgba(245,158,11,.15)", border:"rgba(245,158,11,.3)" },
  closed: { label:"Conclusa",   color:"#16c2a3", bg:"rgba(22,194,163,.12)", border:"rgba(22,194,163,.3)" },
};
const C = { bg:"rgba(255,255,255,.03)", border:"rgba(255,255,255,.08)" };

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits:2, maximumFractionDigits:2 });
}

export default function SalesClient({ initialSales, templates, photoMap, profileMap }: Props) {
  const [modal, setModal]               = useState<{ mode:"add"|"edit"; sale?: SaleRow }|null>(null);
  const [filter, setFilter]             = useState<"all"|"open"|"closed">("all");
  const [search, setSearch]             = useState("");
  const [isPending, startTransition]    = useTransition();
  const [actionId, setActionId]         = useState<string|null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string|null>(null);
  const [confirmCancel, setConfirmCancel] = useState<{saleId:string;stockId:string}|null>(null);
  const [expanded, setExpanded]         = useState<string|null>(null);

  const sales = useMemo(() => {
    let list = initialSales;
    if (filter !== "all") list = list.filter(s => s.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s =>
        (s.buyer_seller ?? "").toLowerCase().includes(q) ||
        (s.notes ?? "").toLowerCase().includes(q) ||
        (s.profile_id ? (profileMap[s.profile_id] ?? s.profile_id) : "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [initialSales, filter, search, profileMap]);

  const revenue = initialSales.filter(s=>s.status==="closed").reduce((a,s)=>a+Number(s.amount??0),0);
  const costs   = initialSales.reduce((a,s)=>a+Number(s.cost??0),0);
  const profit  = revenue - costs;
  const pending = initialSales.filter(s=>s.status==="open").reduce((a,s)=>a+Number(s.amount??0),0);

  function handleDelete(id: string) {
    setConfirmDelete(null); setActionId(id);
    startTransition(async () => { await deleteSale(id); setActionId(null); });
  }
  function handleToggle(s: SaleRow) {
    const next = s.status === "open" ? "closed" : "open";
    setActionId(s.id);
    startTransition(async () => { await changeSaleStatus(s.id, next as "open"|"closed"); setActionId(null); });
  }
  function handleCancel(saleId: string, stockId: string) {
    setConfirmCancel(null); setActionId(saleId);
    startTransition(async () => { await cancelSale({ saleId, stockId }); setActionId(null); });
  }
  function handleConclude(saleId: string, stockId: string) {
    setActionId(saleId);
    startTransition(async () => { await concludeSale({ saleId, stockId }); setActionId(null); });
  }

  return (
    <>
      {modal && <SaleModal mode={modal.mode} sale={modal.sale} templates={templates} onClose={() => setModal(null)} />}

      {/* Modal conferma elimina */}
      {confirmDelete && (
        <div style={{position:"fixed",inset:0,zIndex:90,background:"rgba(0,0,0,.8)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",padding:16}} onClick={()=>setConfirmDelete(null)}>
          <div style={{background:"#131920",border:"1px solid rgba(255,77,109,.25)",borderRadius:20,padding:"24px 20px",width:"100%",maxWidth:440,margin:"0 auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Elimina vendita?</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.5)",marginBottom:20}}>Questa azione non può essere annullata.</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmDelete(null)} style={{flex:1,padding:"13px",borderRadius:12,border:`1px solid ${C.border}`,background:"transparent",color:"rgba(255,255,255,.6)",cursor:"pointer",fontSize:14,fontWeight:600}}>Annulla</button>
              <button onClick={()=>handleDelete(confirmDelete)} style={{flex:1,padding:"13px",borderRadius:12,border:"1px solid rgba(255,77,109,.4)",background:"rgba(255,77,109,.12)",color:"#ff4d6d",cursor:"pointer",fontWeight:700,fontSize:14}}>Elimina</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal conferma annulla vendita */}
      {confirmCancel && (
        <div style={{position:"fixed",inset:0,zIndex:90,background:"rgba(0,0,0,.8)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",padding:16}} onClick={()=>setConfirmCancel(null)}>
          <div style={{background:"#131920",border:"1px solid rgba(245,158,11,.2)",borderRadius:20,padding:"24px 20px",width:"100%",maxWidth:440,margin:"0 auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Annulla vendita?</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.5)",marginBottom:20}}>L&apos;articolo tornerà disponibile in magazzino.</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmCancel(null)} style={{flex:1,padding:"13px",borderRadius:12,border:`1px solid ${C.border}`,background:"transparent",color:"rgba(255,255,255,.6)",cursor:"pointer",fontSize:14,fontWeight:600}}>Chiudi</button>
              <button onClick={()=>handleCancel(confirmCancel.saleId,confirmCancel.stockId)} style={{flex:1,padding:"13px",borderRadius:12,border:"1px solid rgba(245,158,11,.4)",background:"rgba(245,158,11,.1)",color:"#f59e0b",cursor:"pointer",fontWeight:700,fontSize:14}}>Annulla vendita</button>
            </div>
          </div>
        </div>
      )}

      {/* KPI */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {[
          {label:"Ricavi",     value:`€${fmt(revenue)}`,  color:"#16c2a3"},
          {label:"Costi",      value:`€${fmt(costs)}`,    color:"#ff4d6d"},
          {label:"Profitto",   value:`€${fmt(profit)}`,   color:profit>=0?"#16c2a3":"#ff4d6d"},
          {label:"In sospeso", value:`€${fmt(pending)}`,  color:"#f59e0b"},
        ].map(k => (
          <div key={k.label} style={{background:C.bg,border:`1px solid ${C.border}`,borderBottom:`2px solid ${k.color}`,borderRadius:12,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,.4)",marginBottom:5,textTransform:"uppercase",letterSpacing:".05em",fontWeight:600}}>{k.label}</div>
            <div style={{fontSize:18,fontWeight:800,color:k.color,letterSpacing:"-.02em"}}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
        <button onClick={()=>setModal({mode:"add"})} style={{
          display:"flex",alignItems:"center",gap:6,padding:"11px 16px",borderRadius:12,
          border:"1px solid rgba(22,194,163,.4)",background:"rgba(22,194,163,.12)",
          color:"#16c2a3",cursor:"pointer",fontSize:14,fontWeight:700,flexShrink:0
        }}>＋ Vendita</button>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca..."
          style={{flex:1,padding:"11px 14px",borderRadius:12,border:`1px solid ${C.border}`,background:C.bg,color:"rgba(255,255,255,.85)",fontSize:14,outline:"none",fontFamily:"inherit"}} />
      </div>

      {/* Filtri */}
      <div style={{display:"flex",gap:3,marginBottom:14,background:"rgba(255,255,255,.04)",borderRadius:12,padding:3}}>
        {([["all","Tutti"],["open","Sospeso"],["closed","Concluse"]] as const).map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{
            flex:1,padding:"9px 4px",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",
            border:filter===k?"1px solid rgba(22,194,163,.3)":"1px solid transparent",
            background:filter===k?"rgba(22,194,163,.12)":"transparent",
            color:filter===k?"#16c2a3":"rgba(255,255,255,.45)",
          }}>{l}</button>
        ))}
      </div>

      {/* Lista */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {sales.length===0 && (
          <div style={{textAlign:"center",padding:"48px 0",color:"rgba(255,255,255,.3)",fontSize:14}}>Nessuna vendita trovata</div>
        )}
        {sales.map(s => {
          const st     = STATUS_META[s.status as keyof typeof STATUS_META] ?? STATUS_META.open;
          const thumb  = s.template_id_ext ? photoMap[s.template_id_ext] : null;
          const margin = s.cost && Number(s.cost)>0 ? Math.round(((Number(s.amount??0)-Number(s.cost))/Number(s.cost))*100) : null;
          const gain   = Number(s.amount??0) - Number(s.cost??0);
          const busy   = isPending && actionId===s.id;
          const isOpen = expanded===s.id;
          const gainColor = gain>=0?"#16c2a3":"#ff4d6d";
          const profileName = s.profile_id ? (profileMap[s.profile_id]??s.profile_id) : null;

          return (
            <div key={s.id} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",opacity:busy?.5:1,transition:"opacity .2s"}}>
              {/* Riga principale */}
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px",cursor:"pointer"}} onClick={()=>setExpanded(isOpen?null:s.id)}>
                <div style={{width:50,height:50,borderRadius:9,overflow:"hidden",flexShrink:0,background:"rgba(255,255,255,.06)"}}>
                  {thumb
                    ? <img src={thumb} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,opacity:.4}}>📦</div>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:3}}>{s.buyer_seller||"—"}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.4)",display:"flex",gap:5,alignItems:"center"}}>
                    <span>{s.transaction_date?new Date(s.transaction_date).toLocaleDateString("it"):"—"}</span>
                    {profileName && <><span>·</span><span>{profileName}</span></>}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:16,fontWeight:800,marginBottom:2}}>€{fmt(Number(s.amount??0))}</div>
                  {margin!==null && <div style={{fontSize:11,fontWeight:700,color:gainColor}}>▲ {margin}%</div>}
                </div>
                <div style={{fontSize:16,color:"rgba(255,255,255,.2)",marginLeft:2}}>{isOpen?"▾":"▸"}</div>
              </div>

              {/* Stato badge */}
              <div style={{padding:"0 12px 10px",display:"flex",alignItems:"center",gap:8}}>
                <button onClick={()=>handleToggle(s)} style={{
                  padding:"4px 14px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",
                  border:`1px solid ${st.border}`,background:st.bg,color:st.color
                }}>{st.label}</button>
                <span style={{fontSize:11,color:gainColor,fontWeight:600}}>{gain>0?"+":""}€{fmt(gain)}</span>
              </div>

              {/* Azioni espanse */}
              {isOpen && (
                <div style={{borderTop:`1px solid ${C.border}`,padding:"10px 12px",display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={()=>{setExpanded(null);setModal({mode:"edit",sale:s});}} style={{flex:1,padding:"11px",borderRadius:10,border:`1px solid ${C.border}`,background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.8)",cursor:"pointer",fontSize:13,fontWeight:600}}>✏️ Modifica</button>
                  {s.raw_data?.stock_id && s.status==="open" && (
                    <button onClick={()=>handleConclude(s.id,s.raw_data!.stock_id!)} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid rgba(22,194,163,.3)",background:"rgba(22,194,163,.1)",color:"#16c2a3",cursor:"pointer",fontSize:13,fontWeight:700}}>✅ Concludi</button>
                  )}
                  {s.raw_data?.stock_id && (
                    <button onClick={()=>setConfirmCancel({saleId:s.id,stockId:s.raw_data!.stock_id!})} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid rgba(245,158,11,.3)",background:"rgba(245,158,11,.08)",color:"#f59e0b",cursor:"pointer",fontSize:13,fontWeight:600}}>↩ Annulla</button>
                  )}
                  <button onClick={()=>setConfirmDelete(s.id)} style={{padding:"11px 14px",borderRadius:10,border:"1px solid rgba(255,77,109,.25)",background:"transparent",color:"#ff4d6d",cursor:"pointer",fontSize:14}}>🗑</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{height:24}} />
    </>
  );
}
