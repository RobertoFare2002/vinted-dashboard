"use client";
// src/components/MobileTabBar.tsx
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ChangelogModal from "@/components/ChangelogModal";
import SettingsModal from "@/components/SettingsModal";

type TabBarProps = {
  firstName?: string;
  userEmail?: string;
  avatarUrl?: string | null;
};

const TABS = [
  {
    href: "/",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
          stroke={active ? "#007782" : "#aaa"} strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" fill={active ? "rgba(0,119,130,.1)" : "none"}/>
      </svg>
    ),
  },
  {
    href: "/sales",
    label: "Vendite",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="5" width="14" height="12" rx="2"
          stroke={active ? "#007782" : "#aaa"} strokeWidth="1.5"
          fill={active ? "rgba(0,119,130,.1)" : "none"}/>
        <path d="M7 5V4a3 3 0 016 0v1" stroke={active ? "#007782" : "#aaa"} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7 10h6M7 13h4" stroke={active ? "#007782" : "#aaa"} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/stock",
    label: "Stock",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L2 6v8l8 4 8-4V6L10 2z"
          stroke={active ? "#007782" : "#aaa"} strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
          fill={active ? "rgba(0,119,130,.1)" : "none"}/>
        <path d="M2 6l8 4 8-4M10 10v8" stroke={active ? "#007782" : "#aaa"} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/templates",
    label: "Template",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="6" height="6" rx="1.5"
          stroke={active ? "#007782" : "#aaa"} strokeWidth="1.5"
          fill={active ? "rgba(0,119,130,.1)" : "none"}/>
        <rect x="11" y="3" width="6" height="6" rx="1.5"
          stroke={active ? "#007782" : "#aaa"} strokeWidth="1.5"
          fill={active ? "rgba(0,119,130,.1)" : "none"}/>
        <rect x="3" y="11" width="6" height="6" rx="1.5"
          stroke={active ? "#007782" : "#aaa"} strokeWidth="1.5"
          fill={active ? "rgba(0,119,130,.1)" : "none"}/>
        <rect x="11" y="11" width="6" height="6" rx="1.5"
          stroke={active ? "#007782" : "#aaa"} strokeWidth="1.5"
          fill={active ? "rgba(0,119,130,.1)" : "none"}/>
      </svg>
    ),
  },
];

export default function MobileTabBar({ firstName = "", userEmail = "", avatarUrl }: TabBarProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const supabase  = createClient();
  const [open, setOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const [isDark, setIsDark] = useState<boolean>(false);
  const menuRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setIsDark(true);
    else if (saved === "light") setIsDark(false);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <style>{`
        :root {
          --mtb-bg: #fff;
          --mtb-border: #ebebeb;
          --mtb-ink: #111;
          --mtb-slate: #888;
          --mtb-hover: #f5f5f5;
          --mtb-pill-bg: #F0F0F0;
          --mtb-pill-border: #D0D0D0;
        }
        html.dark {
          --mtb-bg: #1c1c1e;
          --mtb-border: rgba(255,255,255,.10);
          --mtb-ink: #f0f0f0;
          --mtb-slate: rgba(255,255,255,.4);
          --mtb-hover: rgba(255,255,255,.07);
          --mtb-pill-bg: rgba(255,255,255,.10);
          --mtb-pill-border: rgba(255,255,255,.15);
        }
        .mtb-root {
          background: var(--mtb-bg); border-top: 0.5px solid var(--mtb-border);
          display: flex; align-items: center;
          padding: 10px 0 max(16px, env(safe-area-inset-bottom));
          flex-shrink: 0; width: 100%; position: relative;
          transition: background .35s, border-color .25s;
        }
        .mtb-item {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; gap: 3px;
          text-decoration: none; cursor: pointer;
        }
        .mtb-label { font-size: 10px; font-weight: 500; font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; line-height: 1; transition: color .25s; }
        .mtb-label-active { color: #007782; font-weight: 700; }
        .mtb-label-inactive { color: var(--mtb-slate); }
        .mtb-menu {
          position: absolute; bottom: calc(100% + 6px); right: 6px;
          background: var(--mtb-bg); border: 0.5px solid var(--mtb-border);
          border-radius: 16px; padding: 6px; min-width: 210px;
          box-shadow: 0 -4px 24px rgba(0,0,0,.12); z-index: 9999;
          transition: background .35s, border-color .25s;
        }
        .mtb-menu-user {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 10px 12px; border-bottom: 0.5px solid var(--mtb-border); margin-bottom: 4px;
        }
        .mtb-menu-name { font-size: 13px; font-weight: 600; color: var(--mtb-ink); transition: color .25s; }
        .mtb-menu-email { font-size: 11px; color: var(--mtb-slate); margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px; transition: color .25s; }
        .mtb-menu-item {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 12px; border-radius: 10px;
          font-size: 13px; font-weight: 500; color: var(--mtb-ink);
          cursor: pointer; border: none; background: transparent;
          font-family: inherit; width: 100%; text-align: left; transition: background .12s, color .25s;
        }
        .mtb-menu-item:hover { background: var(--mtb-hover); }
        .mtb-menu-item.danger { color: #E24B4A; }
        html.dark .mtb-menu-item.danger { color: #ff6b6b; }
        .mtb-divider { height: 0.5px; background: var(--mtb-border); margin: 4px 0; transition: background .25s; }
        .mtb-dark-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; }
        .mtb-dark-label { font-size: 13px; font-weight: 500; color: var(--mtb-ink); transition: color .25s; }
        .mtb-pill { width: 52px; height: 28px; border-radius: 14px; background: var(--mtb-pill-bg); border: 0.5px solid var(--mtb-pill-border); cursor: pointer; position: relative; transition: background .3s, border-color .3s; flex-shrink: 0; padding: 0; }
        .mtb-pill.on { background: #111111; border-color: #111111; border-radius: 14px; }
        .mtb-pill-thumb { position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #ffffff; transition: transform .3s cubic-bezier(.4,0,.2,1); display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .mtb-pill.on .mtb-pill-thumb { transform: translateX(24px); }
        .mtb-ico-sun { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; transition: opacity .2s; }
        .mtb-ico-moon { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; transition: opacity .2s; }
        .mtb-pill:not(.on) .mtb-ico-sun { opacity: 1; }
        .mtb-pill:not(.on) .mtb-ico-moon { opacity: 0; }
        .mtb-pill.on .mtb-ico-sun { opacity: 0; }
        .mtb-pill.on .mtb-ico-moon { opacity: 1; }
      `}</style>

      <nav className="mtb-root">
        {TABS.map(tab => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href} className="mtb-item">
              {tab.icon(active)}
              <span className={`mtb-label ${active ? "mtb-label-active" : "mtb-label-inactive"}`}>{tab.label}</span>
            </Link>
          );
        })}

        {/* Account */}
        <div className="mtb-item" ref={menuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              width: 26, height: 26, borderRadius: "50%", overflow: "hidden",
              border: open ? "2px solid #007782" : "1.5px solid #ebebeb",
              background: "#007782", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", padding: 0, transition: "border .15s",
            }}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{firstName.charAt(0).toUpperCase()}</span>
            }
          </button>
          <span className="mtb-label mtb-label-inactive"
            style={{ maxWidth: 48, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {firstName || "Account"}
          </span>

          {open && (
            <div className="mtb-menu">
              <div className="mtb-menu-user">
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", overflow: "hidden",
                  background: "#007782", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{firstName.charAt(0).toUpperCase()}</span>
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="mtb-menu-name">{firstName}</div>
                  <div className="mtb-menu-email">{userEmail}</div>
                </div>
              </div>

              <button className="mtb-menu-item" onClick={() => { setOpen(false); setSettingsOpen(true); }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Impostazioni account
              </button>

              <button className="mtb-menu-item" onClick={() => { setOpen(false); setChangelogOpen(true); }}>
                <Sparkles size={15} color="#888888" strokeWidth={1.8} />
                Scopri le novità
              </button>

              <div className="mtb-divider" />
              <div className="mtb-dark-row">
                <span className="mtb-dark-label">{isDark ? "Dark mode" : "Light mode"}</span>
                <button className={`mtb-pill${isDark ? " on" : ""}`} onClick={() => setIsDark(v => !v)}>
                  <div className="mtb-pill-thumb">
                    <div className="mtb-ico-sun">
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="2.4" fill="#888"/>
                        <line x1="7" y1="0.5" x2="7" y2="2.2" stroke="#888" strokeWidth="1.3" strokeLinecap="round"/>
                        <line x1="7" y1="11.8" x2="7" y2="13.5" stroke="#888" strokeWidth="1.3" strokeLinecap="round"/>
                        <line x1="0.5" y1="7" x2="2.2" y2="7" stroke="#888" strokeWidth="1.3" strokeLinecap="round"/>
                        <line x1="11.8" y1="7" x2="13.5" y2="7" stroke="#888" strokeWidth="1.3" strokeLinecap="round"/>
                        <line x1="2.4" y1="2.4" x2="3.5" y2="3.5" stroke="#888" strokeWidth="1.3" strokeLinecap="round"/>
                        <line x1="10.5" y1="10.5" x2="11.6" y2="11.6" stroke="#888" strokeWidth="1.3" strokeLinecap="round"/>
                        <line x1="2.4" y1="11.6" x2="3.5" y2="10.5" stroke="#888" strokeWidth="1.3" strokeLinecap="round"/>
                        <line x1="10.5" y1="3.5" x2="11.6" y2="2.4" stroke="#888" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="mtb-ico-moon">
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <path d="M11 7.8A4.8 4.8 0 016.2 3c0-.3.03-.59.08-.88A4.8 4.8 0 1011 7.8z" fill="#888"/>
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
              <div className="mtb-divider" />

              <button className="mtb-menu-item danger" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6"
                    stroke="#E24B4A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Esci
              </button>
            </div>
          )}
        </div>
      </nav>
      {changelogOpen && <ChangelogModal onClose={() => setChangelogOpen(false)} />}
      {settingsOpen  && <SettingsModal userEmail={userEmail || ""} onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
