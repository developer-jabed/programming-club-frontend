import { NavSection } from "@/types/dashboard.interface";
import { getDefaultDashboardRoute, UserRole } from "./auth-utils";

// ─────────────────────────────────────────────────────────────────────────────
// Common (All Roles)
// ─────────────────────────────────────────────────────────────────────────────
export const getCommonNavItems = (role: UserRole): NavSection[] => {
  const defaultDashboard = getDefaultDashboardRoute(role);

  return [
    {
      items: [
      
        { title: "Dashboard", href: defaultDashboard, icon: "LayoutDashboard", roles: ["MEMBER", "MODERATOR", "ADMIN"] },
        { title: "Portfolio", href: "/portfolio", icon: "User", roles: ["MEMBER", "MODERATOR", "ADMIN"] },
        { title: "Leaderboard", href: "/leaderboard", icon: "Trophy", roles: ["MEMBER", "MODERATOR", "ADMIN"] },
        { title: "Notifications", href: "/notifications", icon: "Bell", roles: ["MEMBER", "MODERATOR", "ADMIN"] },
      ],
    },
  ];
};


export const memberNavItems: NavSection[] = [
  {
    title: "Club",
    items: [
      { title: "Projects", href: "/projects", icon: "FolderKanban", roles: ["MEMBER", "MODERATOR"] },
      { title: "Tests", href: "/tests", icon: "ClipboardList", roles: ["MEMBER", "MODERATOR"] },
      { title: "Report & Requests", href: "/report-requests", icon: "FileText", roles: ["MEMBER", "MODERATOR"] },
    ],
  },
];


export const moderatorNavItems: NavSection[] = [
  {
    title: "Manage",
    items: [
      { title: "Projects", href: "/manage/projects", icon: "FolderKanban", roles: ["MODERATOR"] },
      { title: "Tasks & Submissions", href: "/manage/tasks", icon: "ListTodo", roles: ["MODERATOR"] },
      { title: "Tests", href: "/manage/tests", icon: "ClipboardEdit", roles: ["MODERATOR"] },
      { title: "Sectors", href: "/manage/sectors", icon: "Layers", roles: ["MODERATOR"] },
    ],
  },
];


export const adminNavItems: NavSection[] = [
  {
    title: "Administration",
    items: [
      { title: "Users & Roles", href: "/admin/users", icon: "Users", roles: ["ADMIN"] },
      { title: "Sectors", href: "/admin/sectors", icon: "Layers", roles: ["ADMIN"] },
      { title: "Projects", href: "/admin/projects", icon: "FolderKanban", roles: ["ADMIN"] },
      { title: "Tasks", href: "/admin/tasks", icon: "ListTodo", roles: ["ADMIN"] },
      { title: "Tests", href: "/admin/tests", icon: "ClipboardList", roles: ["ADMIN"] },
      { title: "Analytics", href: "/admin/analytics", icon: "BarChart3", roles: ["ADMIN"] },
      { title: "System", href: "/admin/system", icon: "Settings", roles: ["ADMIN"] },
       { title: "Report & Requests", href: "/admin/report-requests", icon: "FileText", roles: [ "ADMIN"] },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Role Resolver
// ─────────────────────────────────────────────────────────────────────────────
export const getNavItemsByRole = (role: UserRole): NavSection[] => {
  const common = getCommonNavItems(role);

  switch (role) {
    case "ADMIN":
      return [...common, ...adminNavItems];
    case "MODERATOR":
      return [...common, ...memberNavItems, ...moderatorNavItems];
    case "MEMBER":
      return [...common, ...memberNavItems];
    default:
      return common;
  }
};