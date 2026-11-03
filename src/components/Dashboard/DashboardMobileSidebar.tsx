"use client";

import { SheetTitle } from "@/components/ui/sheet";
import { NavSection } from "@/types/dashboard.interface";
import { UserInfo } from "@/types/userInterface";
import DashboardSidebarPanel from "./DashboardSidebarPanel";

interface DashboardMobileSidebarContentProps {
  userInfo: UserInfo;
  navItems: NavSection[];
  dashboardHome: string;
  /** Closes the drawer after navigating. */
  onNavigate?: () => void;
}

const DashboardMobileSidebar = ({
  userInfo,
  navItems,
  dashboardHome,
  onNavigate,
}: DashboardMobileSidebarContentProps) => {
  return (
    <div className="h-full w-full">
      <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
      <DashboardSidebarPanel
        userInfo={userInfo}
        navItems={navItems}
        dashboardHome={dashboardHome}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default DashboardMobileSidebar;
