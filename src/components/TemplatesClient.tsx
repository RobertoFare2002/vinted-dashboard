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
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20
        }}>
          {templates.map(tpl => {
            const photos = Array.isArray(tpl.photo_urls) ? tpl.photo_urls.filter(Boolean) : [];
            const cover  = photos[0] ?? null;
            const busy   = isPending && actionId === tpl.id;

            return (
              <div key={tpl.id} style={{
                background: "rgba(18,18,22,.9)",
                border: "1px solid rgba(255,255,255,.10)",
                borderRadius: 16, overflow: "hidden",
                display: "flex", flexDirection: "column",
                opacity: busy ? 0.5 : 1, transition: "opacity .2s",
                position: "relative",
              }}>
                {/* Foto cover */}
                <div style={{
                  width: "100%", aspectRatio: "4/3",
                  background: "rgba(255,255,255,.04)",
                  position: "relative", overflow: "hidden", flexShrink: 0
                }}>
                  {cover
                    ? <img src={cover} alt={tpl.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                        <div style={{ fontSize: 32, opacity: .3 }}>📷</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)" }}>Nessuna foto</div>
                      </div>
                  }
                  {photos.length > 1 && (
                    <div style={{
                      position: "absolute", bottom: 8, right: 8,
                      background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)",
                      color: "rgba(255,255,255,.9)", fontSize: 11, fontWeight: 600,
                      padding: "3px 8px", borderRadius: 6
                    }}>+{photos.length - 1} foto</div>
                  )}

                  {/* Bottoni azione sovrapposti in alto a destra */}
                  <div style={{
                    position: "absolute", top: 8, right: 8,
                    display: "flex", gap: 5,
                  }}>
                    <button onClick={() => setEditTarget(tpl)} style={{
                      padding: "5px 10px", borderRadius: 8, fontSize: 12,
                      border: "1px solid rgba(255,255,255,.2)",
                      background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)",
                      color: "rgba(255,255,255,.85)", cursor: "pointer", fontWeight: 600,
                    }} title="Modifica">✏️</button>
                    <button onClick={() => setConfirmDelete(tpl.id)} style={{
                      padding: "5px 10px", borderRadius: 8, fontSize: 12,
                      border: "1px solid rgba(255,77,109,.3)",
                      background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)",
                      color: "#ff4d6d", cursor: "pointer",
                    }} title="Elimina">🗑</button>
                  </div>
                </div>

                {/* Strip foto secondarie */}
                {photos.length > 1 && (
                  <div style={{ display: "flex", gap: 3, padding: "6px 6px 0", overflowX: "auto" }}>
                    {photos.slice(1, 6).map((url, i) => (
                      <img key={i} src={url} alt=""
                        style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,.08)" }} />
                    ))}
                  </div>
                )}

                {/* Info */}
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
                    <div style={{
                      fontSize: 12, color: "rgba(255,255,255,.40)",
                      overflow: "hidden", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, lineHeight: 1.5
                    }}>
                      {tpl.description}
                    </div>
                  )}
                  <div style={{
                    fontSize: 11, color: "rgba(255,255,255,.25)",
                    marginTop: "auto", paddingTop: 8,
                    borderTop: "1px solid rgba(255,255,255,.06)",
                    display: "flex", justifyContent: "space-between"
                  }}>
                    <span>{photos.length} foto</span>
                    <span>Aggiornato: {new Date(tpl.updated_at).toLocaleDateString("it")}</span>
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
