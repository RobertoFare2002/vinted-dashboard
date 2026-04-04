// src/app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const firstName = user.user_metadata?.display_name?.split(" ")[0]
    ?? user.user_metadata?.full_name?.split(" ")[0]
    ?? user.email?.split("@")[0]
    ?? "Utente";

  return (
    <DashboardShell
      userEmail={user.email ?? ""}
      firstName={firstName}
      avatarUrl={user.user_metadata?.avatar_url ?? null}
    >
      {children}
    </DashboardShell>
  );
}
