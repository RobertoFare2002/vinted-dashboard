// src/app/(dashboard)/templates/page.tsx
import { createClient } from "@/lib/supabase/server";
import type { Template } from "@/lib/types";

export const revalidate = 0; // ← disabilita cache Next.js — legge sempre da Supabase

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("templates")
    .select("*")
    .order("updated_at", { ascending: false });

  const templates = (data ?? []) as Template[];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Template Vinted</h1>
      <p style={{ color: "rgba(255,255,255,.55)", fontSize: 14, marginBottom: 24 }}>
        {templates.length} template sincronizzati dall&apos;estensione
      </p>

      {templates.length === 0 ? (
        <div style={{
          background: "rgba(18,18,22,.9)", border: "1px solid rgba(255,255,255,.10)",
          borderRadius: 14, padding: "56px 24px", textAlign: "center"
        }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📦</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Nessun template ancora</div>
          <div style={{ color: "rgba(255,255,255,.45)", fontSize: 13, maxWidth: 360, margin: "0 auto" }}>
            Crea template dall&apos;estensione e sincronizza con il bottone &quot;Migra tutto&quot;.
          </div>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20
        }}>
          {templates.map(tpl => (
            <TemplateCard key={tpl.id} tpl={tpl} />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateCard({ tpl }: { tpl: Template }) {
  const photos = Array.isArray(tpl.photo_urls) ? tpl.photo_urls.filter(Boolean) : [];
  const cover  = photos[0] ?? null;

  return (
    <div style={{
      background: "rgba(18,18,22,.9)",
      border: "1px solid rgba(255,255,255,.10)",
      borderRadius: 16, overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        width: "100%", aspectRatio: "4/3",
        background: "rgba(255,255,255,.04)",
        position: "relative", overflow: "hidden", flexShrink: 0
      }}>
        {cover ? (
          <img src={cover} alt={tpl.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 32, opacity: .3 }}>📷</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)" }}>Nessuna foto</div>
          </div>
        )}
        {photos.length > 1 && (
          <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)", color: "rgba(255,255,255,.9)", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6 }}>
            +{photos.length - 1} foto
          </div>
        )}
      </div>

      {photos.length > 1 && (
        <div style={{ display: "flex", gap: 3, padding: "6px 6px 0", overflowX: "auto" }}>
          {photos.slice(1, 6).map((url, i) => (
            <img key={i} src={url} alt=""
              style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,.08)" }} />
          ))}
        </div>
      )}

      <div style={{ padding: "12px 14px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {tpl.name}
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {tpl.brand     && <Tag>{tpl.brand}</Tag>}
          {tpl.size      && <Tag>Taglia {tpl.size}</Tag>}
          {tpl.condition && <Tag>{tpl.condition}</Tag>}
          {tpl.category  && <Tag dim>{tpl.category}</Tag>}
        </div>
        {tpl.price != null && (
          <div style={{ fontSize: 20, fontWeight: 700, color: "#16c2a3", marginTop: 2 }}>
            € {Number(tpl.price).toFixed(2)}
          </div>
        )}
        {tpl.description && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.40)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, lineHeight: 1.5 }}>
            {tpl.description}
          </div>
        )}
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)", marginTop: "auto", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between" }}>
          <span>{photos.length} foto</span>
          <span>Aggiornato: {new Date(tpl.updated_at).toLocaleDateString("it")}</span>
        </div>
      </div>
    </div>
  );
}

function Tag({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <span style={{
      fontSize: 11,
      color: dim ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.6)",
      background: dim ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.07)",
      border: "1px solid rgba(255,255,255,.08)",
      padding: "2px 8px", borderRadius: 6, whiteSpace: "nowrap"
    }}>
      {children}
    </span>
  );
}
