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

const PRIMARY = "#007782";
const INK = "#111111";
const SL = "#888888";
const RED = "#FF4D4D";
const AMB = "#F5A623";
const BLU = "#3b82f6";

const CARDS = (s: Props["stats"]) => [
  {
    label:  "Ricavi totali",
    value:  `€ ${fmt(s.totalRevenue)}`,
    icon:   Euro,
    color:  INK,
    iconBg: "#F5F5F5",
    iconColor: INK,
  },
  {
    label:  "Profitto netto",
    value:  `€ ${fmt(s.profit)}`,
    icon:   s.profit >= 0 ? TrendingUp : TrendingDown,
    color:  s.profit >= 0 ? INK : RED,
    iconBg: s.profit >= 0 ? "#F0FAD0" : "rgba(255,77,77,.1)",
    iconColor: s.profit >= 0 ? "#6bb800" : RED,
    highlight: s.profit >= 0,
  },
  {
    label:  "Articoli venduti",
    value:  String(s.itemsSold),
    icon:   ShoppingBag,
    color:  INK,
    iconBg: "#FFF3D0",
    iconColor: AMB,
  },
  {
    label:  "In magazzino",
    value:  String(s.itemsAvailable),
    icon:   Package,
    color:  INK,
    iconBg: "#DBEAFE",
    iconColor: BLU,
  },
  {
    label:  "Annunci attivi",
    value:  String(s.itemsListed),
    icon:   Tag,
    color:  INK,
    iconBg: "#F5F5F5",
    iconColor: SL,
  },
  {
    label:  "Template Vinted",
    value:  String(s.templatesCount),
    icon:   Tag,
    color:  INK,
    iconBg: "#F5F5F5",
    iconColor: SL,
  },
];

export default function StatsCards({ stats }: Props) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
      gap: 16
    }}>
      {CARDS(stats).map(({ label, value, icon: Icon, color, iconBg, iconColor, highlight }) => (
        <div key={label} style={{
          background: highlight ? "#111111" : "#ffffff",
          borderRadius: 20,
          padding: "20px 22px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          border: "none",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{
                fontSize: 11, fontWeight: 600,
                color: highlight ? "rgba(255,255,255,.55)" : SL,
                marginBottom: 10,
                textTransform: "uppercase",
                letterSpacing: ".05em"
              }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: highlight ? PRIMARY : color, letterSpacing: "-.03em" }}>{value}</div>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: highlight ? "rgba(0,119,130,.15)" : iconBg,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Icon size={17} color={highlight ? PRIMARY : iconColor} strokeWidth={1.8} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
