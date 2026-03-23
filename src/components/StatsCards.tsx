"use client";
// src/components/StatsCards.tsx
import { TrendingUp, TrendingDown, Package, ShoppingBag, Tag, Euro } from "lucide-react";

interface Props {
  stats: {
    totalRevenue: number;
    totalCost: number;
    profit: number;
    itemsSold: number;
    itemsAvailable: number;
    itemsListed: number;
    templatesCount: number;
  };
}

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const CARDS = (s: Props["stats"]) => [
  {
    label:  "Ricavi totali",
    value:  `€ ${fmt(s.totalRevenue)}`,
    icon:   Euro,
    color:  "var(--accent)",
    bg:     "rgba(22,194,163,.12)",
    border: "rgba(22,194,163,.25)",
  },
  {
    label:  "Profitto netto",
    value:  `€ ${fmt(s.profit)}`,
    icon:   s.profit >= 0 ? TrendingUp : TrendingDown,
    color:  s.profit >= 0 ? "var(--accent)" : "var(--danger)",
    bg:     s.profit >= 0 ? "rgba(22,194,163,.12)" : "rgba(255,77,109,.10)",
    border: s.profit >= 0 ? "rgba(22,194,163,.25)" : "rgba(255,77,109,.25)",
  },
  {
    label:  "Articoli venduti",
    value:  String(s.itemsSold),
    icon:   ShoppingBag,
    color:  "#f59e0b",
    bg:     "rgba(245,158,11,.10)",
    border: "rgba(245,158,11,.25)",
  },
  {
    label:  "In magazzino",
    value:  String(s.itemsAvailable),
    icon:   Package,
    color:  "#60a5fa",
    bg:     "rgba(59,130,246,.10)",
    border: "rgba(59,130,246,.25)",
  },
  {
    label:  "Annunci attivi",
    value:  String(s.itemsListed),
    icon:   Tag,
    color:  "#c084fc",
    bg:     "rgba(168,85,247,.10)",
    border: "rgba(168,85,247,.25)",
  },
  {
    label:  "Template Vinted",
    value:  String(s.templatesCount),
    icon:   Tag,
    color:  "var(--muted)",
    bg:     "rgba(255,255,255,.04)",
    border: "var(--border)",
  },
];

export default function StatsCards({ stats }: Props) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
      gap: 16
    }}>
      {CARDS(stats).map(({ label, value, icon: Icon, color, bg, border }) => (
        <div key={label} style={{
          background: "rgba(18,18,22,.9)",
          border: `1px solid ${border}`,
          borderRadius: 14, padding: "18px 20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: bg, display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Icon size={18} color={color} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
