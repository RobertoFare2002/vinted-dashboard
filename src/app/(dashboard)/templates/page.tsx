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
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Template Vinted</h1>
        <p style={{ color: "rgba(255,255,255,.55)", fontSize: 14, margin: 0 }}>
          {templates.length} template · modifica dal sito o dall&apos;estensione
        </p>
      </div>

      <TemplatesClient templates={templates} />
    </div>
  );
}
