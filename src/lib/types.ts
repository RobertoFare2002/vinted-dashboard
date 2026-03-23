// src/lib/types.ts

export interface Template {
  id: string;
  user_id: string;
  name: string;
  title: string;
  description: string;
  price: number | null;
  category: string;
  brand: string;
  size: string;
  condition: string;
  colors: string;
  materials: string;
  photo_urls: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  template_id: string | null;
  name: string;
  brand: string;
  category: string;
  size: string;
  condition: string;
  purchase_price: number | null;
  selling_price: number | null;
  quantity: number;
  status: "available" | "listed" | "sold" | "reserved" | "archived";
  location: string;
  notes: string;
  photo_urls: string[] | null;
  vinted_item_id: string | null;
  listed_at: string | null;
  sold_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  inventory_id: string | null;
  type: "purchase" | "sale" | "return" | "expense";
  amount: number;
  platform: string;
  buyer_seller: string;
  notes: string;
  transaction_date: string;
  created_at: string;
}

export interface StatsData {
  totalRevenue: number;
  totalCost: number;
  profit: number;
  itemsSold: number;
  itemsAvailable: number;
  itemsListed: number;
  revenueByMonth: { month: string; revenue: number; cost: number }[];
}
