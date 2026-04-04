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
          overflow-x: hidden;
          max-width: 100vw;
        }
        .shell-body {
          display: flex;
          flex: 1;
          min-height: 0;
          overflow-x: hidden;
        }
        /* shell-main styles in globals.css */
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
