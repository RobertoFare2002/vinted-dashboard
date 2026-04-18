"use client";
// src/components/MobileHeader.tsx
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type Profile = { id: string; name: string; avatar_url?: string | null };

type Props = {
  firstName: string;
  userEmail: string;
  avatarUrl?: string | null;
  greeting: string;
  ytdProfit: number;
  ytdMargin: number;
  ytdRevenue: number;
  allRevenue: number;
  allTimeProfit: number;
  allTimeMargin: number;
  profileRevenue: number;
  profilePending: number;
  profileTotalSales: number;
  profileTotalCost: number;
  stockCount: number;
  allCost: number;
  profiles: Profile[];
  selectedProfileId?: string | null;
};

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MobileHeader({
  firstName, greeting, allTimeProfit, allTimeMargin,
  profileRevenue, profilePending, profileTotalSales, profileTotalCost, stockCount,
  profiles, selectedProfileId,
}: Props) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll infinito: parte dalla metà per poter scorrere in entrambe le direzioni
    const init = () => {
      const half = el.scrollWidth / 2;
      el.scrollLeft = half / 2;
    };
    // Aspetta che il layout sia pronto
    requestAnimationFrame(() => { requestAnimationFrame(init); });
    const onScroll = () => {
      const half = el.scrollWidth / 2;
      if (el.scrollLeft >= half) {
        // Salto istantaneo senza animazione: disabilita scroll-behavior temporaneamente
        el.style.scrollBehavior = "auto";
        el.scrollLeft -= half;
        el.style.scrollBehavior = "";
      } else if (el.scrollLeft <= 0) {
        el.style.scrollBehavior = "auto";
        el.scrollLeft += half;
        el.style.scrollBehavior = "";
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  const handleProfile = (id: string | null) => {
    if (id) router.push(`/?profile=${id}`);
    else router.push("/");
  };

  return (
    <>
      <style>{`
        .mh-root {
          background: linear-gradient(160deg, #007f8c 0%, #005a64 100%);
          padding: 12px 20px 64px; flex-shrink: 0;
        }

        .mh-topbar {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;
        }
        .mh-logo-row { display: flex; align-items: center; gap: 8px; }
        .mh-logo-box {
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(255,255,255,.15); border: 1.5px solid rgba(255,255,255,.3);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .mh-logo-name { color: #fff; font-size: 14px; font-weight: 800; letter-spacing: -.02em; }

        .mh-greeting { color: rgba(255,255,255,.55); font-size: 11px; font-weight: 500; margin-bottom: 1px; }
        .mh-profit-label {
          color: rgba(255,255,255,.45); font-size: 9px; font-weight: 600;
          letter-spacing: .12em; text-transform: uppercase; margin-bottom: 3px;
        }
        .mh-profit-val {
          font-size: 32px; font-weight: 900; color: #a8e63d;
          letter-spacing: -.05em; line-height: 1;
        }
        .mh-profit-sub { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
        .mh-delta {
          background: rgba(168,230,61,.18); border: 1px solid rgba(168,230,61,.4);
          color: #a8e63d; font-size: 11px; font-weight: 700; padding: 3px 12px; border-radius: 999px;
        }
        .mh-delta-sub { color: rgba(255,255,255,.4); font-size: 11px; }

        /* KPI cards */
        .mh-kpi-wrap { padding: 0 14px; margin-top: -44px; position: relative; z-index: 1; }
        .mh-kpi-scroll {
          display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none;
          padding-bottom: 4px; -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          scroll-snap-type: x mandatory;
        }
        .mh-kpi-scroll::-webkit-scrollbar { display: none; }
        .mh-kpi-card {
          background: var(--white, #fff); border-radius: 16px; transition: background .35s;
          padding: 14px 15px; flex-shrink: 0; width: calc(50vw - 24px);
          box-shadow: 0 4px 20px rgba(0,0,0,.12);
          scroll-snap-align: start;
        }
        .mh-kpi-label {
          font-size: 9px; font-weight: 600; color: var(--slate, #888); transition: color .25s;
          text-transform: uppercase; letter-spacing: .06em; margin-bottom: 4px;
        }
        .mh-kpi-val {
          font-size: 20px; font-weight: 800; color: var(--ink, #111); transition: color .25s;
          letter-spacing: -.03em; line-height: 1;
        }
        .mh-kpi-sub { font-size: 10px; font-weight: 600; margin-top: 3px; }
        .kpi-green { color: #6bb800; }
        .kpi-teal  { color: #007782; }
        .kpi-amber { color: #F5A623; }
        .kpi-grey  { color: #888; }
      `}</style>

      <div className="mh-root">
        {/* Logo + profili */}
        <div className="mh-topbar">
          <div className="mh-logo-row">
            <div className="mh-logo-box" style={{ background: "transparent", border: "none", padding: 0, overflow: "hidden" }}>
              <img src="/apple-touch-icon.png" alt="logo" style={{ width: 32, height: 32, borderRadius: 9, objectFit: "cover" }} />
            </div>
            <span className="mh-logo-name">Vinted Assistant Pro</span>
          </div>
          {profiles.length > 0 && (
            <div style={{ display: "flex", alignItems: "center" }}>
              {profiles.map((p, i) => {
                const isActive = selectedProfileId === p.id;
                const size = isActive ? 52 : 42;
                return (
                  <div key={p.id} onClick={() => handleProfile(isActive ? null : p.id)} style={{
                    width: size, height: size, borderRadius: "50%",
                    border: isActive ? "3px solid #007782" : "2.5px solid rgba(255,255,255,.35)",
                    flexShrink: 0, cursor: "pointer",
                    marginLeft: i === 0 ? 0 : -14,
                    zIndex: profiles.length - i, position: "relative",
                    opacity: isActive ? 1 : 0.55,
                    transition: "all .2s", overflow: "hidden",
                    background: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {p.avatar_url
                      ? <img src={p.avatar_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: size * 0.38, fontWeight: 700, color: "#007782" }}>{p.name.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Greeting + profit */}
        <div className="mh-greeting">{greeting},</div>
        <div style={{ color: "#fff", fontSize: 17, fontWeight: 800, letterSpacing: "-.02em", marginBottom: 8 }}>{firstName}</div>
        <div className="mh-profit-label">Profitto totale all time</div>
        <div className="mh-profit-val">€{fmt(allTimeProfit)}</div>
        <div className="mh-profit-sub">
          <span className="mh-delta">+{allTimeMargin}%</span>
          <span className="mh-delta-sub">margine sul costo</span>
        </div>
      </div>

      {/* KPI cards — infinite scroll */}
      <div className="mh-kpi-wrap">
        <div className="mh-kpi-scroll" ref={scrollRef}>
          {/* Set originale */}
          <div className="mh-kpi-card">
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5L14.5 5v6L8 14.5 1.5 11V5L8 1.5z" stroke="#007782" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M8 1.5v13M1.5 5l6.5 3.5L14.5 5" stroke="#007782" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="mh-kpi-label" style={{ margin: 0 }}>Articoli in stock</div>
            </div>
            <div className="mh-kpi-val">{stockCount}</div>
            <div className="mh-kpi-sub kpi-teal">disponibili</div>
          </div>
          <div className="mh-kpi-card">
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M1.5 1.5h2l2.4 7.3h6.6l1.6-4.6H5.3" stroke="#007782" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="7" cy="13" r="1.1" fill="#007782"/>
                <circle cx="11.5" cy="13" r="1.1" fill="#007782"/>
              </svg>
              <div className="mh-kpi-label" style={{ margin: 0 }}>Vendite totali</div>
            </div>
            <div className="mh-kpi-val">{profileTotalSales}</div>
            <div className="mh-kpi-sub kpi-teal">{selectedProfileId ? "profilo" : "all time"}</div>
          </div>
          <div className="mh-kpi-card">
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 4h10M3 8h10M3 12h6" stroke="#6bb800" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <div className="mh-kpi-label" style={{ margin: 0 }}>Ricavi totali</div>
            </div>
            <div className="mh-kpi-val">{`€${fmt(profileRevenue)}`}</div>
            <div className="mh-kpi-sub kpi-green">{selectedProfileId ? "profilo" : "all time"}</div>
          </div>
          <div className="mh-kpi-card">
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="#F5A623" strokeWidth="1.4"/>
                <path d="M8 5v3.5l2 2" stroke="#F5A623" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="mh-kpi-label" style={{ margin: 0 }}>In sospeso</div>
            </div>
            <div className="mh-kpi-val">{`€${fmt(profilePending)}`}</div>
            <div className="mh-kpi-sub kpi-amber">da incassare</div>
          </div>
          <div className="mh-kpi-card">
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M4 6l4-4 4 4M4 10h8" stroke="#FF4D4D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="mh-kpi-label" style={{ margin: 0 }}>Costi acquisto</div>
            </div>
            <div className="mh-kpi-val">{`€${fmt(profileTotalCost)}`}</div>
            <div className="mh-kpi-sub" style={{ color: "#FF4D4D" }}>{selectedProfileId ? "profilo" : "all time"}</div>
          </div>
          {/* Clone per scroll infinito */}
          <div className="mh-kpi-card" aria-hidden="true">
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5L14.5 5v6L8 14.5 1.5 11V5L8 1.5z" stroke="#007782" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M8 1.5v13M1.5 5l6.5 3.5L14.5 5" stroke="#007782" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="mh-kpi-label" style={{ margin: 0 }}>Articoli in stock</div>
            </div>
            <div className="mh-kpi-val">{stockCount}</div>
            <div className="mh-kpi-sub kpi-teal">disponibili</div>
          </div>
          <div className="mh-kpi-card" aria-hidden="true">
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M1.5 1.5h2l2.4 7.3h6.6l1.6-4.6H5.3" stroke="#007782" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="7" cy="13" r="1.1" fill="#007782"/>
                <circle cx="11.5" cy="13" r="1.1" fill="#007782"/>
              </svg>
              <div className="mh-kpi-label" style={{ margin: 0 }}>Vendite totali</div>
            </div>
            <div className="mh-kpi-val">{profileTotalSales}</div>
            <div className="mh-kpi-sub kpi-teal">{selectedProfileId ? "profilo" : "all time"}</div>
          </div>
          <div className="mh-kpi-card" aria-hidden="true">
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 4h10M3 8h10M3 12h6" stroke="#6bb800" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <div className="mh-kpi-label" style={{ margin: 0 }}>Ricavi totali</div>
            </div>
            <div className="mh-kpi-val">{`€${fmt(profileRevenue)}`}</div>
            <div className="mh-kpi-sub kpi-green">{selectedProfileId ? "profilo" : "all time"}</div>
          </div>
          <div className="mh-kpi-card" aria-hidden="true">
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="#F5A623" strokeWidth="1.4"/>
                <path d="M8 5v3.5l2 2" stroke="#F5A623" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="mh-kpi-label" style={{ margin: 0 }}>In sospeso</div>
            </div>
            <div className="mh-kpi-val">{`€${fmt(profilePending)}`}</div>
            <div className="mh-kpi-sub kpi-amber">da incassare</div>
          </div>
          <div className="mh-kpi-card" aria-hidden="true">
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M4 6l4-4 4 4M4 10h8" stroke="#FF4D4D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="mh-kpi-label" style={{ margin: 0 }}>Costi acquisto</div>
            </div>
            <div className="mh-kpi-val">{`€${fmt(profileTotalCost)}`}</div>
            <div className="mh-kpi-sub" style={{ color: "#FF4D4D" }}>{selectedProfileId ? "profilo" : "all time"}</div>
          </div>
        </div>
      </div>
    </>
  );
}