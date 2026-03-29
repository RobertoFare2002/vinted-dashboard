"use client";
// src/components/Sidebar.tsx
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, ShoppingBag, Package2, Tag, LogOut, Menu, X } from "lucide-react";

const NAV = [
  { href: "/",          icon: LayoutDashboard, label: "Dashboard" },
  { href: "/sales",     icon: ShoppingBag,     label: "Vendite"   },
  { href: "/stock",     icon: Package2,        label: "Magazzino" },
  { href: "/templates", icon: Tag,             label: "Template"  },
];

const G = {
  bg:     "rgba(6,8,16,.95)",
  border: "rgba(255,255,255,.07)",
  accent: "#00e5c3",
};

function SidebarContent({
  userEmail,
  onNavigate,
}: {
  userEmail: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      padding: "24px 14px",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, padding: "0 6px" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: "linear-gradient(135deg, rgba(0,229,195,.4), rgba(0,229,195,.08))",
          border: "1px solid rgba(0,229,195,.35)",
          boxShadow: "0 0 20px rgba(0,229,195,.15)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>🏪</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-.02em" }}>Vinted</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 1 }}>Dashboard</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} onClick={onNavigate} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 12, textDecoration: "none",
              fontSize: 13, fontWeight: active ? 700 : 400,
              color: active ? G.accent : "rgba(255,255,255,.5)",
              background: active ? "rgba(0,229,195,.08)" : "transparent",
              border: active ? "1px solid rgba(0,229,195,.15)" : "1px solid transparent",
              boxShadow: active ? "0 0 16px rgba(0,229,195,.06)" : "none",
              transition: "all .18s",
            }}>
              <Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 16, marginTop: 8 }}>
        <div style={{
          fontSize: 11, color: "rgba(255,255,255,.3)",
          padding: "0 12px", marginBottom: 8,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
        }}>{userEmail}</div>
        <button onClick={logout} style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", padding: "9px 12px", borderRadius: 10,
          background: "transparent", border: "1px solid transparent",
          color: "rgba(255,255,255,.4)", fontSize: 13, cursor: "pointer",
          transition: "all .15s",
        }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = "#ff4d6d";
            el.style.background = "rgba(255,77,109,.08)";
            el.style.border = "1px solid rgba(255,77,109,.15)";
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = "rgba(255,255,255,.4)";
            el.style.background = "transparent";
            el.style.border = "1px solid transparent";
          }}
        >
          <LogOut size={15} strokeWidth={1.8} />
          Esci
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Blocca scroll del body quando il drawer è aperto
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <>
      <style>{`
        .sidebar-desktop-wrap { display: none; }
        .sidebar-mobile-topbar { display: flex; }
        @media (min-width: 768px) {
          .sidebar-desktop-wrap  { display: flex; }
          .sidebar-mobile-topbar { display: none; }
        }
        .drawer-slide {
          transform: translateX(-100%);
          transition: transform .28s cubic-bezier(.4,0,.2,1);
        }
        .drawer-slide.open {
          transform: translateX(0);
        }
        .drawer-backdrop {
          opacity: 0;
          transition: opacity .28s ease;
          pointer-events: none;
        }
        .drawer-backdrop.open {
          opacity: 1;
          pointer-events: all;
        }
      `}</style>

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="sidebar-desktop-wrap" style={{
        width: 220, minHeight: "100vh", flexShrink: 0,
        background: G.bg,
        borderRight: `1px solid ${G.border}`,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        flexDirection: "column",
        position: "sticky", top: 0,
      }}>
        <SidebarContent userEmail={userEmail} />
      </aside>

      {/* ── MOBILE: TOPBAR con hamburger ── */}
      <div className="sidebar-mobile-topbar" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 52,
        background: "rgba(6,8,16,.92)",
        borderBottom: `1px solid ${G.border}`,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        alignItems: "center",
        padding: "0 16px",
      }}>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            background: "transparent", border: "none",
            color: "rgba(255,255,255,.7)", cursor: "pointer",
            padding: 6, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Menu size={22} strokeWidth={2} />
        </button>

        {/* Logo centrato */}
        <div style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: "linear-gradient(135deg, rgba(0,229,195,.4), rgba(0,229,195,.08))",
            border: "1px solid rgba(0,229,195,.35)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
          }}>🏪</div>
          <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: "-.02em" }}>Vinted Dashboard</span>
        </div>
      </div>

      {/* ── MOBILE: DRAWER OVERLAY ── */}
      {/* Backdrop */}
      <div
        className={`drawer-backdrop${drawerOpen ? " open" : ""}`}
        onClick={() => setDrawerOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 110,
          background: "rgba(0,0,0,.6)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Drawer panel */}
      <div
        className={`drawer-slide${drawerOpen ? " open" : ""}`}
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0,
          width: 260, zIndex: 120,
          background: G.bg,
          borderRight: `1px solid ${G.border}`,
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          overflowY: "auto",
        }}
      >
        {/* X close button */}
        <button
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "absolute", top: 14, right: 14,
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 8, color: "rgba(255,255,255,.6)",
            cursor: "pointer", padding: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={16} strokeWidth={2} />
        </button>

        <SidebarContent
          userEmail={userEmail}
          onNavigate={() => setDrawerOpen(false)}
        />
      </div>
    </>
  );
}
