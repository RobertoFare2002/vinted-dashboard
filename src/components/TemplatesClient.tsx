// src/components/TemplatesClient.tsx
"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { deleteTemplate } from "@/app/(dashboard)/templates/actions";
import type { Template } from "@/lib/types";

const TemplateModal = dynamic(() => import("./TemplateModal"), { ssr: false });

type Props = { templates: Template[] };

const G   = "#007782";
const GBG = "#f0fad0";
const RED = "#FF4D4D";
const INK = "#111111";
const SL  = "#888888";
const BD  = "#EBEBEB";
const LT  = "#F5F5F5";
const W   = "#ffffff";

export default function TemplatesClient({ templates }: Props) {
  const [editTarget, setEditTarget]     = useState<Template | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isPending, startTransition]    = useTransition();
  const [actionId, setActionId]         = useState<string | null>(null);

  function handleDelete(id: string) {
    setConfirmDelete(null);
    setActionId(id);
    startTransition(async () => {
      await deleteTemplate(id);
      setActionId(null);
    });
  }

  return (
    <>
      {editTarget && (
        <TemplateModal template={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 90,
          background: "rgba(0,0,0,.35)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }} onClick={() => setConfirmDelete(null)}>
          <div style={{
            background: W, border: "none",
            borderRadius: 20, padding: "24px 20px", maxWidth: 380, width: "100%",
            boxShadow: "0 24px 60px rgba(0,0,0,.14)"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: INK }}>Elimina template?</div>
            <div style={{ fontSize: 13, color: SL, marginBottom: 20 }}>
              Il template verrà rimosso dal sito. Se è ancora nell&apos;estensione, verrà ricreato al prossimo sync.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} className="btn btn-outline" style={{ flex: 1 }}>Annulla</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{
                flex: 1, padding: "10px 18px", borderRadius: 999,
                border: `1px solid ${RED}30`, background: `${RED}08`,
                color: RED, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
              }}>Elimina</button>
            </div>
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="card" style={{ padding: "56px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📦</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: INK }}>Nessun template ancora</div>
          <div style={{ color: SL, fontSize: 13, maxWidth: 360, margin: "0 auto" }}>
            Crea template dall&apos;estensione e sincronizza con &quot;Migra tutto su Supabase&quot;.
          </div>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
          gap: 14
        }}>
          {templates.map(tpl => {
            const photos = Array.isArray(tpl.photo_urls) ? tpl.photo_urls.filter(Boolean) : [];
            const cover  = photos[0] ?? null;
            const busy   = isPending && actionId === tpl.id;

            return (
              <div key={tpl.id} className="card" style={{
                padding: 0, overflow: "hidden",
                display: "flex", flexDirection: "column",
                opacity: busy ? 0.5 : 1, transition: "opacity .2s",
              }}>
                {/* Cover */}
                <div style={{
                  width: "100%", aspectRatio: "16/10",
                  background: LT, position: "relative", overflow: "hidden", flexShrink: 0
                }}>
                  {cover
                    ? <img src={cover} alt={tpl.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ fontSize: 22, color: SL, opacity: .3 }}>📷</div>
                      </div>
                  }
                  {photos.length > 1 && (
                    <div style={{
                      position: "absolute", bottom: 6, right: 6,
                      background: "rgba(255,255,255,.85)", backdropFilter: "blur(4px)",
                      color: INK, fontSize: 10, fontWeight: 700,
                      padding: "2px 7px", borderRadius: 999
                    }}>+{photos.length - 1}</div>
                  )}
                  <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 4 }}>
                    <button onClick={() => setEditTarget(tpl)} style={{
                      padding: "4px 8px", borderRadius: 8, fontSize: 12,
                      border: "none",
                      background: "rgba(255,255,255,.85)", backdropFilter: "blur(4px)",
                      color: INK, cursor: "pointer", fontFamily: "inherit"
                    }}>✏️</button>
                    <button onClick={() => setConfirmDelete(tpl.id)} style={{
                      padding: "4px 8px", borderRadius: 8, fontSize: 12,
                      border: "none",
                      background: "rgba(255,255,255,.85)", backdropFilter: "blur(4px)",
                      color: RED, cursor: "pointer", fontFamily: "inherit"
                    }}>🗑</button>
                  </div>
                </div>

                {/* Secondary photos */}
                {photos.length > 1 && (
                  <div style={{ display: "flex", gap: 3, padding: "6px 6px 0", overflowX: "auto" }}>
                    {photos.slice(1, 5).map((url, i) => (
                      <img key={i} src={url} alt=""
                        style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "none" }} />
                    ))}
                  </div>
                )}

                {/* Info */}
                <div style={{ padding: "10px 12px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: INK }}>
                    {tpl.name}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {tpl.brand     && <TagChip>{tpl.brand}</TagChip>}
                    {tpl.size      && <TagChip>Taglia {tpl.size}</TagChip>}
                    {tpl.condition && <TagChip>{tpl.condition}</TagChip>}
                  </div>
                  {tpl.price != null && (
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#6bb800", fontVariantNumeric: "tabular-nums" }}>
                      € {Number(tpl.price).toFixed(2)}
                    </div>
                  )}
                  <div style={{
                    fontSize: 10, color: SL,
                    marginTop: "auto", paddingTop: 8,
                    borderTop: `1px solid ${BD}`,
                    display: "flex", justifyContent: "space-between"
                  }}>
                    <span>{photos.length} foto</span>
                    <span>{new Date(tpl.updated_at).toLocaleDateString("it")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 11,
      color: SL,
      background: LT,
      border: "none",
      padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap"
    }}>{children}</span>
  );
}
