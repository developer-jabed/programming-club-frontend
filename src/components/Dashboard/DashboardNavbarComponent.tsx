"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavSection } from "@/types/dashboard.interface";
import { UserInfo } from "@/types/userInterface";
import {  Menu } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import DashboardMobileSidebar from "./DashboardMobileSidebar";
import NotificationDropdown from "./Notification";
import UserDropdown from "./UserDropdown";

interface DashboardNavbarContentProps {
  userInfo: UserInfo;
  navItems?: NavSection[];
  dashboardHome?: string;
}



const DashboardNavbarContent = ({
  userInfo,
  navItems = [],
  dashboardHome = "/",
}: DashboardNavbarContentProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Close the drawer if the screen grows past the mobile breakpoint.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#07110f]/90 backdrop-blur-xl supports-[backdrop-filter]:bg-[#07110f]/70">
      {/* hairline accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
      />

      <div className="mx-auto flex h-20 max-w-screen-2xl items-center justify-between gap-3 px-4 md:px-6">
        {/* LEFT */}
        <div className="flex min-w-0 items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className="rounded-xl text-slate-300 hover:bg-white/[0.06] hover:text-white"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="w-72 border-r border-white/10 bg-[#07110f] p-0 [&>button]:text-slate-300 [&>button]:opacity-80 [&>button]:hover:text-white [&>button]:hover:opacity-100"
            >
              <DashboardMobileSidebar
                userInfo={userInfo}
                navItems={navItems}
                dashboardHome={dashboardHome}
                onNavigate={closeMobile}
              />
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
           
           
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
      

          

          <div aria-hidden className="hidden h-8 w-px bg-white/[0.08] md:block" />

          <NotificationDropdown />
          <UserDropdown userInfo={userInfo} />
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbarContent;
