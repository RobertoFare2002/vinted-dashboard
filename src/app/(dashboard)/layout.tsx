// src/app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

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

  return (
    <>
      <style>{`
        .dashboard-wrap {
          display: flex;
          min-height: 100vh;
        }
        .dashboard-main {
          flex: 1;
          padding: 28px 32px;
          overflow-x: hidden;
        }
        @media (max-width: 767px) {
          .dashboard-main {
            padding: 72px 16px 24px 16px;
          }
        }
      `}</style>
      <div className="dashboard-wrap">
        <Sidebar userEmail={user.email ?? ""} />
        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </>
  );
}
