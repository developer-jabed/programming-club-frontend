"use client";

import { Badge } from "@/components/ui/badge";
import { getIconComponent } from "@/lib/icon-mapper";
import { cn } from "@/lib/utils";
import { NavSection } from "@/types/dashboard.interface";
import { UserInfo } from "@/types/userInterface";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useMemo } from "react";

type NavItem = NavSection["items"][number];

export interface DashboardSidebarPanelProps {
  userInfo: UserInfo;
  navItems: NavSection[];
  dashboardHome: string;
  /** Called after a link is clicked (used by the mobile drawer to close itself). */
  onNavigate?: () => void;
}

/* ------------------------------------------------------------------ */
/* Single nav link — memoised so only the active/previous one re-render */
/* ------------------------------------------------------------------ */
const NavLink = memo(function NavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const Icon = getIconComponent(item.icon);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none",
        "transition-colors duration-200 motion-reduce:transition-none",
        "focus-visible:ring-2 focus-visible:ring-emerald-400/50",
        isActive
          ? "bg-gradient-to-r from-emerald-400/[0.16] via-emerald-400/[0.06] to-transparent text-white ring-1 ring-inset ring-emerald-400/20"
          : "text-slate-400 hover:bg-white/[0.045] hover:text-slate-100",
      )}
    >
      {isActive && (
        <span
          aria-hidden
          className="absolute -left-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-emerald-300 to-teal-400 shadow-[0_0_14px_rgba(52,211,153,0.75)]"
        />
      )}

      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
          isActive
            ? "text-emerald-300"
            : "text-slate-500 group-hover:text-slate-300",
        )}
      />

      <span className="flex-1 truncate transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none">
        {item.title}
      </span>

      {item.badge && (
        <Badge
          variant="secondary"
          className={cn(
            "ml-auto border-0 px-2 py-0.5 text-[11px] font-semibold",
            isActive
              ? "bg-emerald-400/15 text-emerald-300"
              : "bg-white/[0.06] text-slate-400",
          )}
        >
          {item.badge}
        </Badge>
      )}
    </Link>
  );
});

/* ------------------------------------------------------------------ */
/* Shared sidebar body (desktop aside + mobile drawer)                  */
/* ------------------------------------------------------------------ */
const DashboardSidebarPanel = ({
  userInfo,
  navItems,
  dashboardHome,
  onNavigate,
}: DashboardSidebarPanelProps) => {
  const pathname = usePathname();

  // Longest matching href wins → nested routes (/sectors/12) keep "Sectors"
  // highlighted without also lighting up a shorter parent like /dashboard.
  const activeHref = useMemo(() => {
    let best = "";
    for (const section of navItems) {
      for (const item of section.items) {
        const href = item.href;
        const matches =
          pathname === href ||
          (href !== "/" &&
            pathname.startsWith(href.endsWith("/") ? href : `${href}/`));
        if (matches && href.length > best.length) best = href;
      }
    }
    return best;
  }, [navItems, pathname]);

  const initial = userInfo.name.charAt(0).toUpperCase();

  return (
    <div className="relative isolate flex h-full min-h-0 flex-col overflow-hidden bg-[#07110f]">
      {/* ambient glow — pure CSS, no extra DOM/SVG weight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_55%_at_0%_0%,rgba(16,185,129,0.16),transparent_60%),radial-gradient(90%_45%_at_100%_100%,rgba(245,158,11,0.08),transparent_65%)]"
      />

      {/* BRAND */}
      <div className="flex h-20 shrink-0 items-center border-b border-white/[0.06] px-5">
        <Link
          href={dashboardHome}
          onClick={onNavigate}
          className="group flex items-center gap-3.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
        >
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/15 shadow-[0_0_28px_-4px_rgba(52,211,153,0.5)] transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none">
            <Image
              src="/asset/mothercare.png"
              alt="Mother Care School and College Logo"
              fill
              sizes="44px"
              className="object-cover"
              priority
            />
          </div>

          <div className="flex flex-col">
            <span className="text-xl font-bold leading-none tracking-tight text-white">
              Programming Club
            </span>
            <span className="mt-1.5 text-[11px] font-semibold tracking-wide text-amber-300/90">
              Care for the Future
            </span>
          </div>
        </Link>
      </div>

      {/* NAVIGATION */}
      <nav
        aria-label="Dashboard navigation"
        className="flex-1 space-y-6 overflow-y-auto px-3 py-5 [scrollbar-color:rgba(255,255,255,0.12)_transparent] [scrollbar-width:thin]"
      >
        {navItems.map((section, sectionIdx) => (
          <div
            key={section.title ?? sectionIdx}
            className={cn(sectionIdx > 0 && "border-t border-white/[0.06] pt-5")}
          >
            {section.title && (
              <h4 className="mb-2 px-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {section.title}
              </h4>
            )}

            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={item.href === activeHref}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 backdrop-blur-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-300 to-teal-500 text-base font-bold text-[#04110d] shadow-[0_4px_14px_-2px_rgba(16,185,129,0.5)]">
            {initial}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {userInfo.name}
            </p>
            <p className="truncate text-xs capitalize text-slate-400">
              {userInfo.role.toLowerCase()}
            </p>
          </div>

          <span className="relative flex h-2.5 w-2.5 shrink-0" title="Online">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebarPanel;
