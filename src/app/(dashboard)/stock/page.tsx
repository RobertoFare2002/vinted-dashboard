// src/app/(dashboard)/stock/page.tsx
import { createClient } from "@/lib/supabase/server";

export default async function StockPage() {
  const supabase = await createClient();

  const [{ data: stockData }, { data: templatesData }] = await Promise.all([
    supabase.from("stock_log").select("*").order("purchased_at", { ascending: false }),
    supabase.from("templates").select("id, name, photo_urls"),
  ]);

  const items     = (stockData     ?? []) as any[];
  const templates = (templatesData ?? []) as any[];

  const photoMap: Record<string, string> = {};
  for (const tpl of templates) {
    if (Array.isArray(tpl.photo_urls) && tpl.photo_urls[0]) {
      photoMap[tpl.id] = tpl.photo_urls[0];
    }
  }

  const nowTs      = Date.now();
  const totalItems = items.reduce((sum: number, i: any) => sum + Number(i.quantity ?? 1), 0);
  const totalCost  = items.reduce((sum: number, i: any) => sum + (Number(i.purchase_price ?? 0) * Number(i.quantity ?? 1)), 0);
  const stale      = items.filter((i: any) => {
    if (!i.purchased_at) return false;
    return Math.floor((nowTs - new Date(i.purchased_at).getTime()) / 86400000) > 60;
  }).length;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Stock Magazzino</h1>
      <p style={{ color: "rgba(255,255,255,.55)", fontSize: 13, marginBottom: 20 }}>
        {items.length} articoli totali
      </p>

      {/* KPI: 3 col su tutte le dimensioni */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Articoli totali",    value: String(totalItems),          color: "#60a5fa" },
          { label: "Costo totale",       value: `€ ${totalCost.toFixed(2)}`, color: "#ff4d6d" },
          { label: "Fermi >60gg",        value: String(stale),               color: "#f59e0b" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "rgba(18,18,22,.9)", border: "1px solid rgba(255,255,255,.10)",
            borderRadius: 14, padding: "14px 12px"
          }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.55)", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div style={{ background: "rgba(18,18,22,.9)", border: "1px solid rgba(255,255,255,.10)", borderRadius: 14, overflow: "hidden" }}>

        {/* MOBILE: card list */}
        <div className="stock-mobile-list">
          {items.length === 0 ? (
            <div style={{ padding: "48px 16px", textAlign: "center", color: "rgba(255,255,255,.35)" }}>Nessun articolo ancora</div>
          ) : items.map((item: any, i: number) => {
            const days    = item.purchased_at ? Math.floor((nowTs - new Date(item.purchased_at).getTime()) / 86400000) : null;
            const isStale = days !== null && days > 60;
            const thumb   = item.template_id_ext ? (photoMap[item.template_id_ext] ?? null) : null;

            return (
              <div key={item.id} style={{
                padding: "14px 16px",
                borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none",
                display: "flex", alignItems: "center", gap: 12,
                background: isStale ? "rgba(245,158,11,.03)" : "transparent"
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                  background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)",
                  overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {thumb
                    ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 20, opacity: .3 }}>📷</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.name || "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>
                    {item.size ? `Taglia ${item.size}` : ""}
                    {item.size && item.purchased_at ? " · " : ""}
                    {item.purchased_at ? new Date(item.purchased_at).toLocaleDateString("it") : ""}
                    {item.profile_id ? ` · ${item.profile_id}` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                    {item.purchase_price != null ? `€${Number(item.purchase_price).toFixed(2)}` : "—"}
                  </div>
                  {days !== null && (
                    <div style={{ fontSize: 11, color: isStale ? "#f59e0b" : "rgba(255,255,255,.4)", fontWeight: isStale ? 700 : 400 }}>
                      {isStale ? "⚠️ " : ""}{days}gg
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* DESKTOP: tabella */}
        <div className="stock-desktop-table" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.03)" }}>
                {["Data acq.","Prodotto","Taglia","Qtà","Costo acq.","Giorni","Profilo"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,.45)", fontWeight: 500, fontSize: 12, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: ".04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "48px 16px", textAlign: "center", color: "rgba(255,255,255,.35)" }}>Nessun articolo ancora</td></tr>
              ) : items.map((item: any, i: number) => {
                const days    = item.purchased_at ? Math.floor((nowTs - new Date(item.purchased_at).getTime()) / 86400000) : null;
                const isStale = days !== null && days > 60;
                const thumb   = item.template_id_ext ? (photoMap[item.template_id_ext] ?? null) : null;
                return (
                  <tr key={item.id} style={{ borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none", background: isStale ? "rgba(245,158,11,.03)" : "transparent" }}>
                    <td style={{ padding: "14px 16px", color: "rgba(255,255,255,.5)", whiteSpace: "nowrap", fontSize: 12 }}>{item.purchased_at ? new Date(item.purchased_at).toLocaleDateString("it") : "—"}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 8, flexShrink: 0, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {thumb ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 18, opacity: .3 }}>📷</span>}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name || "—"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "rgba(255,255,255,.55)" }}>{item.size || "—"}</td>
                    <td style={{ padding: "14px 16px", color: "rgba(255,255,255,.7)", fontWeight: 600 }}>{item.quantity ?? 1}</td>
                    <td style={{ padding: "14px 16px", color: "rgba(255,255,255,.7)" }}>{item.purchase_price != null ? `€${Number(item.purchase_price).toFixed(2)}` : "—"}</td>
                    <td style={{ padding: "14px 16px" }}>
                      {days !== null ? <span style={{ color: isStale ? "#f59e0b" : "rgba(255,255,255,.5)", fontWeight: isStale ? 700 : 400 }}>{isStale ? "⚠️ " : ""}{days}gg</span> : "—"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "rgba(255,255,255,.4)", fontSize: 12 }}>{item.profile_id || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .stock-mobile-list   { display: block; }
        .stock-desktop-table { display: none; }
        @media (min-width: 768px) {
          .stock-mobile-list   { display: none; }
          .stock-desktop-table { display: block; }
        }
      `}</style>
    </div>
  );
}
