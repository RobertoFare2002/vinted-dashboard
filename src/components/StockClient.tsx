"use client";
// src/components/StockClient.tsx
import { useState, useMemo, useTransition } from "react";
import { deleteStockItem } from "@/app/(dashboard)/stock/actions";
import SellModal from "@/components/SellModal";

type StockItem = {
  id: string; name: string|null; size: string|null; quantity: number|null;
  purchase_price: number|null; status: string|null; purchased_at: string|null;
  profile_id: string|null; external_id: string|null; location: string|null;
  template_id_ext: string|null;
};
type Props = {
  initialItems: StockItem[];
  photoMap:     Record<string, string>;
  profileMap:   Record<string, string>;
};

const STATUS_META = {
  available: { label:"Disponibile", color:"#16c2a3" },
  reserved:  { label:"In sospeso",  color:"#f59e0b" },
  sold:      { label:"Venduto",     color:"rgba(255,255,255,.3)" },
  archived:  { label:"Archiviato",  color:"rgba(255,255,255,.2)" },
};
const C = { bg:"rgba(255,255,255,.03)", border:"rgba(255,255,255,.08)" };

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits:2, maximumFractionDigits:2 });
}

function daysSince(dateStr: string|null) {
  if (!dateStr) return 0;
  return Math.floor((Date.now()-new Date(dateStr).getTime())/86400000);
}

export default function StockClient({ initialItems, photoMap, profileMap }: Props) {
  const [filterStatus, setFilterStatus] = useState("available");
  const [search, setSearch]             = useState("");
  const [sellTarget, setSellTarget]     = useState<StockItem|null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string|null>(null);
  const [isPending, startTransition]    = useTransition();
  const [actionId, setActionId]         = useState<string|null>(null);
  const nowTs = Date.now();

  const items = useMemo(() => {
    let list = initialItems;
    if (filterStatus !== "all") list = list.filter(i => i.status === filterStatus);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i =>
        (i.name ?? "").toLowerCase().includes(q) ||
        (i.profile_id ? (profileMap[i.profile_id]??i.profile_id) : "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [initialItems, filterStatus, search, profileMap]);

  const available = initialItems.filter(i=>i.status==="available");
  const reserved  = initialItems.filter(i=>i.status==="reserved");
  const totalCost = available.reduce((s,i)=>s+(Number(i.purchase_price??0)*Number(i.quantity??1)),0);
  const stale     = available.filter(i=>daysSince(i.purchased_at)>60).length;

  function handleDelete(id: string) {
    setConfirmDelete(null); setActionId(id);
    startTransition(async () => { await deleteStockItem(id); setActionId(null); });
  }

  return (
    <>
      {sellTarget && (
        <SellModal
          item={sellTarget}
          thumb={sellTarget.template_id_ext ? (photoMap[sellTarget.template_id_ext]??null) : null}
          onClose={() => setSellTarget(null)}
        />
      )}

      {confirmDelete && (
        <div style={{position:"fixed",inset:0,zIndex:90,background:"rgba(0,0,0,.8)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",padding:16}} onClick={()=>setConfirmDelete(null)}>
          <div style={{background:"#131920",border:"1px solid rgba(255,77,109,.25)",borderRadius:20,padding:"24px 20px",width:"100%",maxWidth:440,margin:"0 auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Elimina articolo?</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.5)",marginBottom:20}}>L&apos;articolo verrà rimosso dal magazzino.</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmDelete(null)} style={{flex:1,padding:"13px",borderRadius:12,border:`1px solid ${C.border}`,background:"transparent",color:"rgba(255,255,255,.6)",cursor:"pointer",fontSize:14,fontWeight:600}}>Annulla</button>
              <button onClick={()=>handleDelete(confirmDelete)} style={{flex:1,padding:"13px",borderRadius:12,border:"1px solid rgba(255,77,109,.4)",background:"rgba(255,77,109,.12)",color:"#ff4d6d",cursor:"pointer",fontWeight:700,fontSize:14}}>Elimina</button>
            </div>
          </div>
        </div>
      )}

      {/* KPI */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
        {[
          {label:"Disponibili",  value:String(available.reduce((s,i)=>s+Number(i.quantity??1),0)), color:"#16c2a3"},
          {label:"In sospeso",   value:String(reserved.length),  color:"#f59e0b"},
          {label:"Costo tot.",   value:`€${fmt(totalCost)}`,     color:"#ff4d6d"},
          {label:">60gg",        value:String(stale),            color:"#f59e0b"},
        ].map(k=>(
          <div key={k.label} style={{background:C.bg,border:`1px solid ${C.border}`,borderBottom:`2px solid ${k.color}`,borderRadius:12,padding:"10px 10px"}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,.4)",marginBottom:4,textTransform:"uppercase",letterSpacing:".04em",fontWeight:600}}>{k.label}</div>
            <div style={{fontSize:16,fontWeight:800,color:k.color,letterSpacing:"-.02em",wordBreak:"break-all"}}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filtri */}
      <div style={{display:"flex",gap:3,marginBottom:10,background:"rgba(255,255,255,.04)",borderRadius:12,padding:3}}>
        {([["available","Disponibili"],["reserved","Sospeso"],["sold","Venduti"],["all","Tutti"]] as const).map(([k,l])=>(
          <button key={k} onClick={()=>setFilterStatus(k)} style={{
            flex:1,padding:"8px 2px",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",
            border:filterStatus===k?"1px solid rgba(22,194,163,.3)":"1px solid transparent",
            background:filterStatus===k?"rgba(22,194,163,.12)":"transparent",
            color:filterStatus===k?"#16c2a3":"rgba(255,255,255,.4)",
          }}>{l}</button>
        ))}
      </div>

      {/* Cerca */}
      <div style={{position:"relative",marginBottom:14}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca articolo, profilo..."
          style={{width:"100%",padding:"11px 14px",borderRadius:12,border:`1px solid ${C.border}`,background:C.bg,color:"rgba(255,255,255,.85)",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}} />
        <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"rgba(255,255,255,.25)"}}>{items.length} di {initialItems.length}</span>
      </div>

      {/* Lista */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {items.length===0 && (
          <div style={{textAlign:"center",padding:"48px 0",color:"rgba(255,255,255,.3)",fontSize:14}}>Nessun articolo</div>
        )}
        {items.map(item => {
          const st      = STATUS_META[item.status as keyof typeof STATUS_META] ?? STATUS_META.available;
          const thumb   = item.template_id_ext ? photoMap[item.template_id_ext] : null;
          const days    = daysSince(item.purchased_at);
          const isStale = days > 60;
          const busy    = isPending && actionId===item.id;
          const profileName = item.profile_id ? (profileMap[item.profile_id]??item.profile_id) : null;

          return (
            <div key={item.id} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,display:"flex",alignItems:"center",gap:10,padding:"12px",opacity:busy?.5:1,transition:"opacity .2s"}}>
              {/* Thumb */}
              <div style={{width:52,height:52,borderRadius:10,overflow:"hidden",flexShrink:0,background:"rgba(255,255,255,.06)"}}>
                {thumb
                  ? <img src={thumb} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,opacity:.3}}>📦</div>}
              </div>

              {/* Info */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{item.name||"—"}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.4)",display:"flex",gap:5,flexWrap:"wrap",marginBottom:4}}>
                  {item.size && <span>T. {item.size}</span>}
                  {item.purchased_at && <span>· {new Date(item.purchased_at).toLocaleDateString("it")}</span>}
                  {profileName && <span>· {profileName}</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11,color:st.color,fontWeight:700}}>{st.label}</span>
                  {isStale && <span style={{fontSize:10,color:"#f59e0b",fontWeight:700}}>⚠ {days}gg</span>}
                </div>
              </div>

              {/* Destra */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
                <div style={{fontSize:15,fontWeight:800}}>€{fmt(Number(item.purchase_price??0))}</div>
                {item.status==="available" && (
                  <button onClick={()=>setSellTarget(item)} style={{
                    padding:"6px 14px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",
                    border:"1px solid rgba(22,194,163,.4)",background:"rgba(22,194,163,.12)",color:"#16c2a3",
                    whiteSpace:"nowrap"
                  }}>Vendi</button>
                )}
                {item.status==="reserved" && (
                  <span style={{fontSize:11,color:"#f59e0b",fontWeight:700,padding:"5px 10px",borderRadius:8,background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.25)"}}>Sospeso</span>
                )}
                <button onClick={()=>setConfirmDelete(item.id)} style={{padding:"4px 8px",borderRadius:7,border:"1px solid rgba(255,77,109,.2)",background:"transparent",color:"#ff4d6d",cursor:"pointer",fontSize:12}}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{height:24}} />
    </>
  );
}
