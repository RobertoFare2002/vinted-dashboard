"use client";
// src/components/DashboardShell.tsx
import { useState } from "react";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import MobileTabBar from "@/components/MobileTabBar";

export default function DashboardShell({
  userEmail,
  firstName,
  avatarUrl,
  children,
}: {
  userEmail: string;
  firstName?: string;
  avatarUrl?: string | null;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <style>{`
        .shell {
          display: flex;
          flex-direction: column;
          height: 100dvh;
          max-height: 100dvh;
          overflow: hidden;
          max-width: 100vw;
          position: relative;
        }
        .shell-body {
          display: flex;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        /* TopNav hidden on mobile */
        .shell-topnav { display: flex; }
        .shell-tabbar  { display: none; }
        @media (max-width: 860px) {
          .shell-topnav { display: none; }
          /* shell rimane flex column a 100dvh — è corretto */
          /* shell-body prende tutto lo spazio tra top e tab bar */
          .shell-body {
            flex: 1;
            min-height: 0;
            overflow: hidden;
          }
          /* shell-main è lo UNICO scroll container */
          .shell-tabbar { display: flex; flex-shrink: 0; }
        }
      `}</style>

      <div className="shell">
        <div className="shell-topnav" style={{ width: "100%" }}>
          <TopNav
            userEmail={userEmail}
            onMenuToggle={() => setDrawerOpen(prev => !prev)}
          />
        </div>
        <div className="shell-body">
          <main className="shell-main">
            {children}
          </main>
        </div>
        <div className="shell-tabbar" style={{ width: "100%" }}>
          <MobileTabBar firstName={firstName} userEmail={userEmail} avatarUrl={avatarUrl} />
        </div>
      </div>
    </>
  );
}
