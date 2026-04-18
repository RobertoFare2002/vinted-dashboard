// src/app/(dashboard)/templates/page.tsx
import { createClient } from "@/lib/supabase/server";
import type { Template } from "@/lib/types";
import TemplatesClient from "@/components/TemplatesClient";

export const revalidate = 0;

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("templates")
    .select("*")
    .order("updated_at", { ascending: false });

  const templates = (data ?? []) as Template[];

  return (
    <div className="page-scroll">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, color: "var(--ink)", letterSpacing: "-.03em" }}>Template Vinted</h1>
        <p style={{ color: "var(--slate)", fontSize: 13, margin: 0 }}>
          {templates.length} template · modifica dal sito o dall&apos;estensione
        </p>
      </div>

      <TemplatesClient templates={templates} />
    </div>
  );
}
