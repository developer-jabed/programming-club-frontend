"use client";

import { NavSection } from "@/types/dashboard.interface";
import { UserInfo } from "@/types/userInterface";
import DashboardSidebarPanel from "./DashboardSidebarPanel";

interface DashboardSidebarContentProps {
  userInfo: UserInfo;
  navItems: NavSection[];
  dashboardHome: string;
}

const DashboardSidebarContent = ({
  userInfo,
  navItems,
  dashboardHome,
}: DashboardSidebarContentProps) => {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/[0.06] shadow-[8px_0_40px_-12px_rgba(0,0,0,0.6)] md:block">
      <DashboardSidebarPanel
        userInfo={userInfo}
        navItems={navItems}
        dashboardHome={dashboardHome}
      />
    </aside>
  );
};

export default DashboardSidebarContent;
