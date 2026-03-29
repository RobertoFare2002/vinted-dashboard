"use client";
// src/components/Sidebar.tsx
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, ShoppingBag, Package2, Tag, LogOut } from "lucide-react";

const NAV = [
  { href: "/",          icon: LayoutDashboard, label: "Dashboard" },
  { href: "/sales",     icon: ShoppingBag,     label: "Vendite"   },
  { href: "/stock",     icon: Package2,        label: "Magazzino" },
  { href: "/templates", icon: Tag,             label: "Template"  },
];

const G = {
  bg:     "rgba(6,8,16,.85)",
  border: "rgba(255,255,255,.07)",
  accent: "#00e5c3",
};

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="hidden md:flex" style={{
        width: 220, minHeight: "100vh", flexShrink: 0,
        background: G.bg,
        borderRight: `1px solid ${G.border}`,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        flexDirection: "column",
        padding: "24px 14px",
        position: "sticky", top: 0,
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
              <Link key={href} href={href} style={{
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
      </aside>

      {/* ── BOTTOM NAV MOBILE ── */}
      <nav className="md:hidden" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(6,8,16,.92)",
        borderTop: "1px solid rgba(255,255,255,.07)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        display: "flex", alignItems: "center",
        padding: "8px 8px",
        paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
      }}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 4,
              padding: "6px 4px", borderRadius: 12, textDecoration: "none",
              color: active ? "#00e5c3" : "rgba(255,255,255,.38)",
              background: active ? "rgba(0,229,195,.09)" : "transparent",
              border: active ? "1px solid rgba(0,229,195,.14)" : "1px solid transparent",
              fontSize: 9, fontWeight: active ? 700 : 500,
              transition: "all .15s",
            }}>
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ lineHeight: 1 }}>{label}</span>
            </Link>
          );
        })}
        <button onClick={logout} style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 4,
          padding: "6px 4px", borderRadius: 12,
          background: "transparent", border: "1px solid transparent",
          color: "rgba(255,255,255,.38)", fontSize: 9, cursor: "pointer", fontWeight: 500,
        }}>
          <LogOut size={18} strokeWidth={1.8} />
          <span style={{ lineHeight: 1 }}>Esci</span>
        </button>
      </nav>
    </>
  );
}
