// src/components/TemplatesClient.tsx
"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { deleteTemplate } from "@/app/(dashboard)/templates/actions";
import type { Template } from "@/lib/types";

const TemplateModal = dynamic(() => import("./TemplateModal"), { ssr: false });

type Props = { templates: Template[] };

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
      {/* Modal modifica */}
      {editTarget && (
        <TemplateModal template={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {/* Modale conferma eliminazione */}
      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 90,
          background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }} onClick={() => setConfirmDelete(null)}>
          <div style={{
            background: "#121216", border: "1px solid rgba(255,77,109,.25)",
            borderRadius: 16, padding: "28px 24px", maxWidth: 360, width: "100%",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Elimina template?</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginBottom: 24 }}>
              Il template verrà rimosso dal sito. Se è ancora nell&apos;estensione, verrà ricreato al prossimo sync.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{
                flex: 1, padding: "9px", borderRadius: 9,
                border: "1px solid rgba(255,255,255,.10)", background: "transparent",
                color: "rgba(255,255,255,.55)", cursor: "pointer", fontSize: 13
              }}>Annulla</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{
                flex: 1, padding: "9px", borderRadius: 9,
                border: "1px solid rgba(255,77,109,.4)",
                background: "rgba(255,77,109,.12)", color: "#ff4d6d",
                cursor: "pointer", fontWeight: 650, fontSize: 13
              }}>Elimina</button>
            </div>
          </div>
        </div>
      )}

      {/* Griglia template */}
      {templates.length === 0 ? (
        <div style={{
          background: "rgba(18,18,22,.9)", border: "1px solid rgba(255,255,255,.10)",
          borderRadius: 14, padding: "56px 24px", textAlign: "center"
        }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📦</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Nessun template ancora</div>
          <div style={{ color: "rgba(255,255,255,.45)", fontSize: 13, maxWidth: 360, margin: "0 auto" }}>
            Crea template dall&apos;estensione e sincronizza con &quot;Migra tutto su Supabase&quot;.
          </div>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12
        }}>
          {templates.map(tpl => {
            const photos = Array.isArray(tpl.photo_urls) ? tpl.photo_urls.filter(Boolean) : [];
            const cover  = photos[0] ?? null;
            const busy   = isPending && actionId === tpl.id;

            return (
              <div key={tpl.id} style={{
                background: "rgba(18,18,22,.9)",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 12, overflow: "hidden",
                display: "flex", flexDirection: "column",
                opacity: busy ? 0.5 : 1, transition: "opacity .2s",
                position: "relative",
              }}>
                {/* Foto cover */}
                <div style={{
                  width: "100%", aspectRatio: "16/10",
                  background: "rgba(255,255,255,.04)",
                  position: "relative", overflow: "hidden", flexShrink: 0
                }}>
                  {cover
                    ? <img src={cover} alt={tpl.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ fontSize: 22, opacity: .2 }}>📷</div>
                      </div>
                  }
                  {photos.length > 1 && (
                    <div style={{
                      position: "absolute", bottom: 5, right: 5,
                      background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)",
                      color: "rgba(255,255,255,.85)", fontSize: 10, fontWeight: 600,
                      padding: "2px 6px", borderRadius: 5
                    }}>+{photos.length - 1}</div>
                  )}
                  {/* Bottoni azione */}
                  <div style={{ position: "absolute", top: 5, right: 5, display: "flex", gap: 3 }}>
                    <button onClick={() => setEditTarget(tpl)} style={{
                      padding: "3px 7px", borderRadius: 6, fontSize: 11,
                      border: "1px solid rgba(255,255,255,.15)",
                      background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)",
                      color: "rgba(255,255,255,.8)", cursor: "pointer",
                    }}>✏️</button>
                    <button onClick={() => setConfirmDelete(tpl.id)} style={{
                      padding: "3px 7px", borderRadius: 6, fontSize: 11,
                      border: "1px solid rgba(255,77,109,.3)",
                      background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)",
                      color: "#ff4d6d", cursor: "pointer",
                    }}>🗑</button>
                  </div>
                </div>

                {/* Strip foto secondarie */}
                {photos.length > 1 && (
                  <div style={{ display: "flex", gap: 2, padding: "4px 4px 0", overflowX: "auto" }}>
                    {photos.slice(1, 5).map((url, i) => (
                      <img key={i} src={url} alt=""
                        style={{ width: 34, height: 34, borderRadius: 4, objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,.06)" }} />
                    ))}
                  </div>
                )}

                {/* Info */}
                <div style={{ padding: "8px 10px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tpl.name}
                  </div>
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    {tpl.brand     && <Tag>{tpl.brand}</Tag>}
                    {tpl.size      && <Tag>Taglia {tpl.size}</Tag>}
                    {tpl.condition && <Tag>{tpl.condition}</Tag>}
                  </div>
                  {tpl.price != null && (
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#16c2a3" }}>
                      € {Number(tpl.price).toFixed(2)}
                    </div>
                  )}
                  <div style={{
                    fontSize: 10, color: "rgba(255,255,255,.25)",
                    marginTop: "auto", paddingTop: 6,
                    borderTop: "1px solid rgba(255,255,255,.05)",
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

function Tag({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <span style={{
      fontSize: 11,
      color: dim ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.6)",
      background: dim ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.07)",
      border: "1px solid rgba(255,255,255,.08)",
      padding: "2px 8px", borderRadius: 6, whiteSpace: "nowrap"
    }}>{children}</span>
  );
}
