"use client";
// src/components/MobileHeader.tsx
import { useRouter } from "next/navigation";

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
  profileRevenue: number;
  profilePending: number;
  stockCount: number;
  allCost: number;
  profiles: Profile[];
  selectedProfileId?: string | null;
};

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MobileHeader({
  firstName, greeting, ytdProfit, ytdMargin,
  profileRevenue, profilePending, stockCount,
  profiles, selectedProfileId,
}: Props) {
  const router = useRouter();
  const handleProfile = (id: string | null) => {
    if (id) router.push(`/?profile=${id}`);
    else router.push("/");
  };

  return (
    <>
      <style>{`
        .mh-root { background: #007782; padding: 18px 20px 44px; flex-shrink: 0; }

        .mh-topbar {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px;
        }
        .mh-logo-row { display: flex; align-items: center; gap: 9px; }
        .mh-logo-box {
          width: 32px; height: 32px; border-radius: 9px;
          background: rgba(255,255,255,.15); border: 1.5px solid rgba(255,255,255,.3);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .mh-logo-name { color: #fff; font-size: 15px; font-weight: 800; letter-spacing: -.02em; }

        .mh-greeting { color: #fff; font-size: 18px; font-weight: 700; margin-bottom: 2px; letter-spacing: -.02em; }
        .mh-profit-label {
          color: rgba(255,255,255,.6); font-size: 11px; font-weight: 600;
          letter-spacing: .08em; text-transform: uppercase; margin-bottom: 4px;
        }
        .mh-profit-val {
          font-size: 52px; font-weight: 800; color: #a8e63d;
          letter-spacing: -.04em; line-height: 1;
        }
        .mh-profit-sub { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
        .mh-delta {
          background: rgba(168,230,61,.2); color: #a8e63d;
          font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px;
        }
        .mh-delta-sub { color: rgba(255,255,255,.55); font-size: 12px; }

        /* KPI cards */
        .mh-kpi-wrap { padding: 0 16px; margin-top: -24px; position: relative; z-index: 1; }
        .mh-kpi-scroll {
          display: flex; gap: 12px; overflow-x: auto; scrollbar-width: none;
          padding-bottom: 4px; -webkit-overflow-scrolling: touch;
        }
        .mh-kpi-scroll::-webkit-scrollbar { display: none; }
        .mh-kpi-card {
          background: #fff; border-radius: 18px;
          padding: 18px 20px; flex-shrink: 0; width: calc(50vw - 28px);
          box-shadow: 0 2px 16px rgba(0,0,0,.09);
        }
        .mh-kpi-label {
          font-size: 10px; font-weight: 600; color: #888;
          text-transform: uppercase; letter-spacing: .06em; margin-bottom: 7px;
        }
        .mh-kpi-val {
          font-size: 22px; font-weight: 800; color: #111;
          letter-spacing: -.03em; line-height: 1;
        }
        .mh-kpi-sub { font-size: 10px; font-weight: 600; margin-top: 5px; }
        .kpi-green { color: #6bb800; }
        .kpi-teal  { color: #007782; }
        .kpi-amber { color: #F5A623; }
        .kpi-grey  { color: #888; }
      `}</style>

      <div className="mh-root">
        {/* Logo + profili */}
        <div className="mh-topbar">
          <div className="mh-logo-row">
            <div className="mh-logo-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="7" width="18" height="13" rx="3" stroke="#fff" strokeWidth="1.8"/>
                <path d="M8 7V5a4 4 0 018 0v2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="9" cy="13" r="1.5" fill="#fff"/>
                <circle cx="15" cy="13" r="1.5" fill="#fff"/>
                <path d="M9 17h6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="mh-logo-name">Vinted Assistant Pro</span>
          </div>
          {profiles.length > 0 && (
            <div style={{ display: "flex", alignItems: "center" }}>
              {profiles.map((p, i) => {
                const isActive = selectedProfileId === p.id;
                const size = isActive ? 40 : 30;
                return (
                  <div key={p.id} onClick={() => handleProfile(isActive ? null : p.id)} style={{
                    width: size, height: size, borderRadius: "50%",
                    border: isActive ? "3px solid #fff" : "2.5px solid rgba(255,255,255,.35)",
                    flexShrink: 0, cursor: "pointer",
                    marginLeft: i === 0 ? 0 : -10,
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
        <div className="mh-greeting">{greeting}, {firstName} 👋</div>
        <div className="mh-profit-label">Profitto totale YTD</div>
        <div className="mh-profit-val">€{fmt(ytdProfit)}</div>
        <div className="mh-profit-sub">
          <span className="mh-delta">+{ytdMargin}%</span>
          <span className="mh-delta-sub">margine sul costo</span>
        </div>
      </div>

      {/* KPI cards — scrollable, 3 cards */}
      <div className="mh-kpi-wrap">
        <div className="mh-kpi-scroll">
          <div className="mh-kpi-card">
            <div className="mh-kpi-label">Articoli in stock</div>
            <div className="mh-kpi-val" style={{ color: "#007782" }}>{stockCount}</div>
            <div className="mh-kpi-sub kpi-grey">disponibili</div>
          </div>
          <div className="mh-kpi-card">
            <div className="mh-kpi-label">Ricavi totali</div>
            <div className="mh-kpi-val">€{fmt(profileRevenue)}</div>
            <div className="mh-kpi-sub kpi-green">{selectedProfileId ? "profilo" : "all time"}</div>
          </div>
          <div className="mh-kpi-card">
            <div className="mh-kpi-label">In sospeso</div>
            <div className="mh-kpi-val" style={{ color: "#F5A623" }}>€{fmt(profilePending)}</div>
            <div className="mh-kpi-sub kpi-amber">da incassare</div>
          </div>
        </div>
      </div>
    </>
  );
}
