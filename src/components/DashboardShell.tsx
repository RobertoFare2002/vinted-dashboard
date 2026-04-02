"use client";
// src/components/DashboardShell.tsx
// Client wrapper that combines TopNav + Sidebar + content
import { useState } from "react";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";

export default function DashboardShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <style>{`
        .shell {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .shell-body {
          display: flex;
          flex: 1;
          min-height: 0;
        }
        .shell-main {
          flex: 1;
          padding: 28px 28px 40px;
          min-width: 0;
          overflow-x: hidden;
          background: #F5F5F5;
        }
        @media (max-width: 860px) {
          .shell-main {
            padding: 20px 16px 28px;
          }
        }
      `}</style>

      <div className="shell">
        <TopNav
          userEmail={userEmail}
          onMenuToggle={() => setDrawerOpen(prev => !prev)}
        />
        <div className="shell-body">

          <main className="shell-main">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
