// src/app/(dashboard)/templates/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Non autenticato.");
  return { supabase, user };
}

export type TemplateInput = {
  name:        string;
  title:       string;
  description: string;
  price:       number | null;
  category:    string;
  brand:       string;
  size:        string;
  condition:   string;
  colors:      string;
  materials:   string;
};

export async function updateTemplate(id: string, input: TemplateInput) {
  const { supabase, user } = await getAuthenticatedClient();

  const { error } = await supabase
    .from("templates")
    .update({
      name:        input.name.trim(),
      title:       input.title.trim(),
      description: input.description.trim(),
      price:       input.price,
      category:    input.category.trim(),
      brand:       input.brand.trim(),
      size:        input.size.trim(),
      condition:   input.condition.trim(),
      colors:      input.colors.trim(),
      materials:   input.materials.trim(),
      updated_at:  new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/templates");
}

export async function deleteTemplate(id: string) {
  const { supabase, user } = await getAuthenticatedClient();

  const { error } = await supabase
    .from("templates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/templates");
}
