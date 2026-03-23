"use client";
// src/components/Sidebar.tsx
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Package, Tag, ArrowLeftRight, ShoppingBag, BarChart2, LogOut } from "lucide-react";

const NAV = [
  { href: "/",             icon: LayoutDashboard, label: "Dashboard"   },
  { href: "/sales",        icon: ShoppingBag,     label: "Vendite"     },
  { href: "/stock",        icon: BarChart2,        label: "Magazzino"   },
  { href: "/templates",    icon: Tag,             label: "Template"    },
  { href: "/transactions", icon: ArrowLeftRight,  label: "Transazioni" },
  { href: "/inventory",    icon: Package,         label: "Inventario"  },
];

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
    <aside style={{
      width: 220, minHeight: "100vh", flexShrink: 0,
      background: "rgba(12,12,16,.95)",
      borderRight: "1px solid rgba(255,255,255,.08)",
      display: "flex", flexDirection: "column",
      padding: "20px 12px", position: "sticky", top: 0
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, padding: "0 8px" }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: "linear-gradient(135deg,rgba(22,194,163,.35),rgba(22,194,163,.1))",
          border: "1px solid rgba(22,194,163,.3)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
        }}>🏪</div>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Vinted</span>
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 10, textDecoration: "none",
              fontSize: 13, fontWeight: active ? 600 : 400,
              color: active ? "var(--accent)" : "rgba(255,255,255,.55)",
              background: active ? "rgba(22,194,163,.10)" : "transparent",
              border: active ? "1px solid rgba(22,194,163,.18)" : "1px solid transparent",
              transition: "all .15s"
            }}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 14, marginTop: 14 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", padding: "0 12px", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {userEmail}
        </div>
        <button onClick={logout} style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", padding: "9px 12px", borderRadius: 10,
          background: "transparent", border: "1px solid transparent",
          color: "rgba(255,255,255,.45)", fontSize: 13, cursor: "pointer"
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#ff4d6d"; (e.currentTarget as HTMLElement).style.background = "rgba(255,77,109,.08)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.45)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <LogOut size={16} />
          Esci
        </button>
      </div>
    </aside>
  );
}
