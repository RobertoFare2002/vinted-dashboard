"use client";
// src/components/MobileTabBar.tsx
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
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
  const menuRef   = useRef<HTMLDivElement>(null);

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
        .mtb-root {
          background: #fff; border-top: 0.5px solid #ebebeb;
          display: flex; align-items: center;
          padding: 10px 0 max(16px, env(safe-area-inset-bottom));
          flex-shrink: 0; width: 100%; position: relative;
        }
        .mtb-item {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; gap: 3px;
          text-decoration: none; cursor: pointer;
        }
        .mtb-label { font-size: 10px; font-weight: 500; font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; line-height: 1; }
        .mtb-label-active { color: #007782; font-weight: 700; }
        .mtb-label-inactive { color: #aaa; }
        .mtb-menu {
          position: absolute; bottom: calc(100% + 6px); right: 6px;
          background: #fff; border: 0.5px solid #ebebeb;
          border-radius: 16px; padding: 6px; min-width: 210px;
          box-shadow: 0 -4px 24px rgba(0,0,0,.12); z-index: 9999;
        }
        .mtb-menu-user {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 10px 12px; border-bottom: 0.5px solid #ebebeb; margin-bottom: 4px;
        }
        .mtb-menu-name { font-size: 13px; font-weight: 600; color: #111; }
        .mtb-menu-email { font-size: 11px; color: #888; margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px; }
        .mtb-menu-item {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 12px; border-radius: 10px;
          font-size: 13px; font-weight: 500; color: #111;
          cursor: pointer; border: none; background: transparent;
          font-family: inherit; width: 100%; text-align: left; transition: background .12s;
        }
        .mtb-menu-item:hover { background: #f5f5f5; }
        .mtb-menu-item.danger { color: #E24B4A; }
        .mtb-divider { height: 0.5px; background: #ebebeb; margin: 4px 0; }
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
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
                  <path d="M12 8v4l3 3"/>
                </svg>
                Scopri le novità
              </button>

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
