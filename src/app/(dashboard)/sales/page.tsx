// src/app/(dashboard)/sales/page.tsx
import { createClient } from "@/lib/supabase/server";

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  open:   { label: "In sospeso", color: "#f59e0b", bg: "rgba(245,158,11,.12)", border: "rgba(245,158,11,.3)" },
  closed: { label: "Conclusa",   color: "#16c2a3", bg: "rgba(22,194,163,.12)", border: "rgba(22,194,163,.3)" },
};

export default async function SalesPage() {
  const supabase = await createClient();

  const [{ data: salesData }, { data: templatesData }] = await Promise.all([
    supabase.from("sales_log").select("*").order("transaction_date", { ascending: false }),
    supabase.from("templates").select("id, name, photo_urls"),
  ]);

  const sales     = (salesData     ?? []) as any[];
  const templates = (templatesData ?? []) as any[];

  const photoMap: Record<string, string> = {};
  for (const tpl of templates) {
    if (Array.isArray(tpl.photo_urls) && tpl.photo_urls[0]) {
      photoMap[tpl.id] = tpl.photo_urls[0];
    }
  }

  const closed       = sales.filter((s: any) => s.status === "closed");
  const totalRevenue = closed.reduce((sum: number, s: any) => sum + Number(s.amount ?? 0), 0);
  const totalCost    = sales.reduce((sum: number, s: any) => sum + Number(s.cost ?? 0), 0);
  const profit       = totalRevenue - totalCost;
  const pending      = sales.filter((s: any) => s.status === "open").length;

  const kpiItems = [
    { label: "Ricavi conclusi", value: `€ ${totalRevenue.toFixed(2)}`, color: "#16c2a3" },
    { label: "Costi totali",    value: `€ ${totalCost.toFixed(2)}`,    color: "#ff4d6d" },
    { label: "Profitto netto",  value: `€ ${profit.toFixed(2)}`,       color: profit >= 0 ? "#16c2a3" : "#ff4d6d" },
    { label: "In sospeso",      value: String(pending),                 color: "#f59e0b" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Vendite</h1>
      <p style={{ color: "rgba(255,255,255,.55)", fontSize: 13, marginBottom: 20 }}>
        {sales.length} vendite totali
      </p>

      {/* KPI: 2 col mobile, 4 col desktop */}
      <div className="sales-kpi-grid" style={{ marginBottom: 20 }}>
        {kpiItems.map(({ label, value, color }) => (
          <div key={label} style={{
            background: "rgba(18,18,22,.9)", border: "1px solid rgba(255,255,255,.10)",
            borderRadius: 14, padding: "14px 16px"
          }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Lista card su mobile, tabella su desktop */}
      <div style={{ background: "rgba(18,18,22,.9)", border: "1px solid rgba(255,255,255,.10)", borderRadius: 14, overflow: "hidden" }}>

        {/* MOBILE: card list */}
        <div className="mobile-list">
          {sales.length === 0 ? (
            <div style={{ padding: "48px 16px", textAlign: "center", color: "rgba(255,255,255,.35)" }}>Nessuna vendita ancora</div>
          ) : sales.map((s: any, i: number) => {
            const meta   = STATUS_META[s.status] ?? STATUS_META.open;
            const amount = Number(s.amount ?? 0);
            const cost   = Number(s.cost   ?? 0);
            const diff   = amount - cost;
            const margin = cost > 0 ? Math.round((diff / cost) * 100) : null;
            const thumb  = s.template_id_ext ? (photoMap[s.template_id_ext] ?? null) : null;

            return (
              <div key={s.id} style={{
                padding: "14px 16px",
                borderBottom: i < sales.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none",
                display: "flex", alignItems: "center", gap: 12
              }}>
                {/* Thumbnail */}
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
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.buyer_seller || "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>
                    {new Date(s.transaction_date).toLocaleDateString("it")}
                    {s.profile_id ? ` · ${s.profile_id}` : ""}
                  </div>
                </div>
                {/* Prezzo + stato */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>€{amount.toFixed(2)}</div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                    {margin !== null && (
                      <span style={{ fontSize: 11, color: margin >= 0 ? "#16c2a3" : "#ff4d6d", fontWeight: 600 }}>
                        {margin >= 0 ? "▲" : "▼"} {Math.abs(margin)}%
                      </span>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
                      {meta.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* DESKTOP: tabella */}
        <div className="desktop-table" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.03)" }}>
                {["Data","Prodotto","Costo acq.","Prezzo vend.","Margine %","Stato","Profilo"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,.45)", fontWeight: 500, fontSize: 12, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: ".04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "48px 16px", textAlign: "center", color: "rgba(255,255,255,.35)" }}>Nessuna vendita ancora</td></tr>
              ) : sales.map((s: any, i: number) => {
                const meta   = STATUS_META[s.status] ?? STATUS_META.open;
                const amount = Number(s.amount ?? 0);
                const cost   = Number(s.cost   ?? 0);
                const diff   = amount - cost;
                const margin = cost > 0 ? Math.round((diff / cost) * 100) : null;
                const thumb  = s.template_id_ext ? (photoMap[s.template_id_ext] ?? null) : null;
                return (
                  <tr key={s.id} style={{ borderBottom: i < sales.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none" }}>
                    <td style={{ padding: "14px 16px", color: "rgba(255,255,255,.5)", whiteSpace: "nowrap", fontSize: 12 }}>{new Date(s.transaction_date).toLocaleDateString("it")}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 8, flexShrink: 0, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {thumb ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 18, opacity: .3 }}>📷</span>}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{s.buyer_seller || "—"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "rgba(255,255,255,.7)" }}>{cost > 0 ? `€${cost.toFixed(2)}` : "—"}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>€{amount.toFixed(2)}</div>
                      {diff > 0 && <div style={{ fontSize: 11, color: "#16c2a3", marginTop: 2 }}>+€{diff.toFixed(2)}</div>}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {margin !== null ? <span style={{ color: margin >= 0 ? "#16c2a3" : "#ff4d6d", fontWeight: 700 }}>{margin >= 0 ? "▲" : "▼"} {Math.abs(margin)}%</span> : "—"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>{meta.label}</span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "rgba(255,255,255,.4)", fontSize: 12 }}>{s.profile_id || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .sales-kpi-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
        .mobile-list    { display: block; }
        .desktop-table  { display: none; }
        @media (min-width: 768px) {
          .sales-kpi-grid { grid-template-columns: repeat(4,1fr); gap: 16px; }
          .mobile-list    { display: none; }
          .desktop-table  { display: block; }
        }
      `}</style>
    </div>
  );
}
