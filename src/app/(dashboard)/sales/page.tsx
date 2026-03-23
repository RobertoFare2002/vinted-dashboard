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

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Vendite</h1>
      <p style={{ color: "rgba(255,255,255,.55)", fontSize: 14, marginBottom: 24 }}>
        {sales.length} vendite totali
      </p>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Ricavi conclusi", value: `€ ${totalRevenue.toFixed(2)}`, color: "#16c2a3" },
          { label: "Costi totali",    value: `€ ${totalCost.toFixed(2)}`,    color: "#ff4d6d" },
          { label: "Profitto netto",  value: `€ ${profit.toFixed(2)}`,       color: profit >= 0 ? "#16c2a3" : "#ff4d6d" },
          { label: "In sospeso",      value: String(pending),                 color: "#f59e0b" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "rgba(18,18,22,.9)", border: "1px solid rgba(255,255,255,.10)",
            borderRadius: 14, padding: "18px 20px"
          }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabella */}
      <div style={{ background: "rgba(18,18,22,.9)", border: "1px solid rgba(255,255,255,.10)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.03)" }}>
                {["Data","Prodotto","Prezzo d'acquisto","Prezzo di vendita","Margine %","Stato","Profilo"].map(h => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left",
                    color: "rgba(255,255,255,.45)", fontWeight: 500,
                    fontSize: 12, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: ".04em"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "48px 16px", textAlign: "center", color: "rgba(255,255,255,.35)" }}>
                  Nessuna vendita ancora
                </td></tr>
              ) : sales.map((s: any, i: number) => {
                const meta   = STATUS_META[s.status] ?? STATUS_META.open;
                const amount = Number(s.amount ?? 0);
                const cost   = Number(s.cost   ?? 0);
                const diff   = amount - cost;
                const margin = cost > 0 ? Math.round((diff / cost) * 100) : null;
                const thumb  = s.template_id_ext ? (photoMap[s.template_id_ext] ?? null) : null;

                return (
                  <tr key={s.id} style={{ borderBottom: i < sales.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none" }}>
                    <td style={{ padding: "14px 16px", color: "rgba(255,255,255,.5)", whiteSpace: "nowrap", fontSize: 12 }}>
                      {new Date(s.transaction_date).toLocaleDateString("it")}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 8, flexShrink: 0,
                          background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)",
                          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          {thumb
                            ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            : <span style={{ fontSize: 18, opacity: .3 }}>📷</span>
                          }
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{s.buyer_seller || "—"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "rgba(255,255,255,.7)" }}>
                      {cost > 0 ? `€${cost.toFixed(2)}` : "—"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>€{amount.toFixed(2)}</div>
                      {diff > 0 && <div style={{ fontSize: 11, color: "#16c2a3", marginTop: 2 }}>+€{diff.toFixed(2)}</div>}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {margin !== null
                        ? <span style={{ color: margin >= 0 ? "#16c2a3" : "#ff4d6d", fontWeight: 700 }}>{margin >= 0 ? "▲" : "▼"} {Math.abs(margin)}%</span>
                        : "—"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
                        {meta.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "rgba(255,255,255,.4)", fontSize: 12 }}>
                      {s.profile_id || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
