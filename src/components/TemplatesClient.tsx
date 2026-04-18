// src/components/TemplatesClient.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import dynamic from "next/dynamic";
import { deleteTemplate } from "@/app/(dashboard)/templates/actions";
import type { Template } from "@/lib/types";

const TemplateModal = dynamic(() => import("./TemplateModal"), { ssr: false });

const RED = "#FF4D4D";
const INK = "var(--ink)";
const SL  = "var(--slate)";
const BD  = "var(--border)";
const LT  = "var(--light)";
const W   = "var(--white)";

type LightboxState = { photos: string[]; index: number } | null;

export default function TemplatesClient({ templates }: { templates: Template[] }) {
  const [editTarget,     setEditTarget]     = useState<Template | null>(null);
  const [confirmDelete,  setConfirmDelete]  = useState<string | null>(null);
  const [isPending,      startTransition]   = useTransition();
  const [actionId,       setActionId]       = useState<string | null>(null);
  const [search,         setSearch]         = useState("");
  const [lightbox,       setLightbox]       = useState<LightboxState>(null);

  /* ── Filtro ── */
  const filtered = templates.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (t.name      ?? "").toLowerCase().includes(q) ||
      (t.brand     ?? "").toLowerCase().includes(q) ||
      (t.size      ?? "").toLowerCase().includes(q) ||
      (t.condition ?? "").toLowerCase().includes(q)
    );
  });

  /* ── Lightbox: tastiera ── */
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")      setLightbox(null);
      if (e.key === "ArrowRight")  setLightbox(l => l && l.index < l.photos.length - 1 ? { ...l, index: l.index + 1 } : l);
      if (e.key === "ArrowLeft")   setLightbox(l => l && l.index > 0 ? { ...l, index: l.index - 1 } : l);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox]);

  /* ── Lightbox: swipe touch ── */
  useEffect(() => {
    if (!lightbox) return;
    let startX = 0;
    const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const onEnd   = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) setLightbox(l => l && l.index < l.photos.length - 1 ? { ...l, index: l.index + 1 } : l);
      else        setLightbox(l => l && l.index > 0 ? { ...l, index: l.index - 1 } : l);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend",   onEnd,   { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend",   onEnd);
    };
  }, [lightbox]);

  function handleDelete(id: string) {
    setConfirmDelete(null);
    setActionId(id);
    startTransition(async () => { await deleteTemplate(id); setActionId(null); });
  }

  function openLightbox(photos: string[], index: number) {
    if (photos.length === 0) return;
    setLightbox({ photos, index });
  }

  return (
    <>
      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 9900,
            background: "rgba(0,0,0,.93)", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {/* Counter */}
          <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)" }}>
            <div style={{ background: "rgba(255,255,255,.14)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "4px 16px", borderRadius: 999 }}>
              {lightbox.index + 1} / {lightbox.photos.length}
            </div>
          </div>

          {/* Chiudi */}
          <button onClick={() => setLightbox(null)} style={{
            position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,.14)",
            border: "none", color: "#fff", width: 38, height: 38, borderRadius: "50%",
            fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>

          {/* Precedente */}
          {lightbox.index > 0 && (
            <button onClick={e => { e.stopPropagation(); setLightbox(l => l ? { ...l, index: l.index - 1 } : l); }} style={{
              position: "absolute", left: 14, background: "rgba(255,255,255,.14)",
              border: "none", color: "#fff", width: 46, height: 46, borderRadius: "50%",
              fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>‹</button>
          )}

          {/* Foto principale */}
          <img
            src={lightbox.photos[lightbox.index]}
            alt=""
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: "88vw", maxHeight: "78vh", objectFit: "contain", borderRadius: 14, boxShadow: "0 12px 60px rgba(0,0,0,.6)", userSelect: "none" }}
          />

          {/* Successiva */}
          {lightbox.index < lightbox.photos.length - 1 && (
            <button onClick={e => { e.stopPropagation(); setLightbox(l => l ? { ...l, index: l.index + 1 } : l); }} style={{
              position: "absolute", right: 14, background: "rgba(255,255,255,.14)",
              border: "none", color: "#fff", width: 46, height: 46, borderRadius: "50%",
              fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>›</button>
          )}

          {/* Thumbnail strip */}
          {lightbox.photos.length > 1 && (
            <div
              onClick={e => e.stopPropagation()}
              style={{ position: "absolute", bottom: 18, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6, padding: "0 16px", flexWrap: "wrap" }}
            >
              {lightbox.photos.map((url, i) => (
                <div
                  key={i}
                  onClick={() => setLightbox(l => l ? { ...l, index: i } : l)}
                  style={{
                    width: 46, height: 46, borderRadius: 9, overflow: "hidden", flexShrink: 0, cursor: "pointer",
                    border: i === lightbox.index ? "2.5px solid #ffffff" : "2.5px solid rgba(255,255,255,.25)",
                    opacity: i === lightbox.index ? 1 : 0.55, transition: "all .15s",
                  }}
                >
                  <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Confirm delete ── */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,.35)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setConfirmDelete(null)}>
          <div style={{ background: W, border: `1px solid ${BD}`, borderRadius: 20, padding: "24px 20px", maxWidth: 380, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,.14)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: INK }}>Elimina template?</div>
            <div style={{ fontSize: 13, color: SL, marginBottom: 20 }}>
              Il template verrà rimosso. Se è ancora nell&apos;estensione, verrà ricreato al prossimo sync.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} className="btn btn-outline" style={{ flex: 1 }}>Annulla</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ flex: 1, padding: "10px 18px", borderRadius: 999, border: `1px solid ${RED}30`, background: `${RED}08`, color: RED, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Elimina</button>
            </div>
          </div>
        </div>
      )}

      {editTarget && <TemplateModal template={editTarget} onClose={() => setEditTarget(null)} />}

      {/* ── Search ── */}
      <div style={{ marginBottom: 16, position: "relative" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
          style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: SL, pointerEvents: "none" }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cerca per nome, brand, taglia…"
          style={{
            width: "100%", padding: "10px 14px 10px 36px",
            borderRadius: 12, border: `1px solid ${BD}`,
            background: W, color: INK, fontSize: 13,
            outline: "none", fontFamily: "inherit", boxSizing: "border-box",
            boxShadow: "0 2px 8px rgba(0,0,0,.04)",
          }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: SL, cursor: "pointer", fontSize: 14, padding: 4 }}>✕</button>
        )}
      </div>

      {/* Contatore risultati */}
      {search && (
        <div style={{ fontSize: 12, color: SL, marginBottom: 12 }}>
          {filtered.length} risultat{filtered.length === 1 ? "o" : "i"} per &ldquo;{search}&rdquo;
        </div>
      )}

      {/* ── Empty states ── */}
      {templates.length === 0 ? (
        <div className="card" style={{ padding: "56px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📦</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: INK }}>Nessun template ancora</div>
          <div style={{ color: SL, fontSize: 13, maxWidth: 360, margin: "0 auto" }}>
            Crea template dall&apos;estensione e sincronizza con &quot;Migra tutto su Supabase&quot;.
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 0", color: SL, fontSize: 14 }}>
          Nessun risultato per &ldquo;{search}&rdquo;
        </div>
      ) : (
        /* ── Griglia ── */
        <div className="tpl-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14 }}>
          {filtered.map(tpl => {
            const photos = Array.isArray(tpl.photo_urls) ? tpl.photo_urls.filter(Boolean) : [];
            const cover  = photos[0] ?? null;
            const busy   = isPending && actionId === tpl.id;

            return (
              <div key={tpl.id} className="card tpl-card" style={{
                padding: 0, overflow: "hidden",
                display: "flex", flexDirection: "column",
                opacity: busy ? 0.5 : 1,
              }}>

                {/* ── Cover (click → lightbox) ── */}
                <div
                  onClick={() => openLightbox(photos, 0)}
                  style={{
                    width: "100%", aspectRatio: "1/1",
                    background: LT, position: "relative", overflow: "hidden",
                    flexShrink: 0, cursor: cover ? "zoom-in" : "default",
                  }}
                >
                  {cover
                    ? <img src={cover} alt={tpl.name} className="tpl-cover-img" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 28, opacity: .2 }}>📷</span>
                      </div>
                  }

                  {/* Zoom overlay (desktop hover) */}
                  {cover && (
                    <div className="tpl-zoom-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 42, height: 42, background: "rgba(255,255,255,.92)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,.18)" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.3">
                          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                          <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Badge n° foto */}
                  {photos.length > 1 && (
                    <div style={{
                      position: "absolute", bottom: 7, left: 7,
                      background: "rgba(0,0,0,.52)", backdropFilter: "blur(4px)",
                      color: "#fff", fontSize: 10, fontWeight: 700,
                      padding: "2px 9px", borderRadius: 999,
                    }}>+{photos.length - 1}</div>
                  )}

                  {/* Azioni */}
                  <div style={{ position: "absolute", top: 7, right: 7, display: "flex", gap: 5 }}>
                    <button
                      onClick={e => { e.stopPropagation(); setEditTarget(tpl); }}
                      style={{ padding: "5px 9px", borderRadius: 8, fontSize: 12, border: "none", background: "rgba(255,255,255,.88)", backdropFilter: "blur(4px)", color: "#111", cursor: "pointer" }}
                    >✏️</button>
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDelete(tpl.id); }}
                      style={{ padding: "5px 9px", borderRadius: 8, fontSize: 12, border: "none", background: "rgba(255,255,255,.88)", backdropFilter: "blur(4px)", color: RED, cursor: "pointer" }}
                    >🗑</button>
                  </div>
                </div>

                {/* ── Thumbnail strip ── */}
                {photos.length > 1 && (
                  <div style={{ display: "flex", gap: 4, padding: "7px 8px 0", overflowX: "auto", scrollbarWidth: "none" }}>
                    {photos.map((url, i) => (
                      <img
                        key={i} src={url} alt=""
                        className="tpl-thumb"
                        onClick={() => openLightbox(photos, i)}
                        style={{
                          width: 34, height: 34, borderRadius: 7,
                          objectFit: "cover", flexShrink: 0, cursor: "zoom-in",
                          border: "1.5px solid transparent",
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* ── Info ── */}
                <div style={{ padding: "10px 12px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: INK }}>
                    {tpl.name}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {tpl.brand     && <TagChip>{tpl.brand}</TagChip>}
                    {tpl.size      && <TagChip>Taglia {tpl.size}</TagChip>}
                    {tpl.condition && <TagChip>{tpl.condition}</TagChip>}
                  </div>
                  {tpl.price != null && (
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#6bb800", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
                      € {Number(tpl.price).toFixed(2)}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: SL, marginTop: "auto", paddingTop: 6, borderTop: `1px solid ${BD}`, display: "flex", justifyContent: "space-between" }}>
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
    <span style={{ fontSize: 11, color: "var(--slate)", background: "var(--light)", padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}
