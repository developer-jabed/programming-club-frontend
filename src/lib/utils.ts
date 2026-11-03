import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/* ─────────────────────────────────────────────
   Tailwind Class Merge Helper
───────────────────────────────────────────── */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ─────────────────────────────────────────────
   Get Initials from Name
───────────────────────────────────────────── */
export function initials(name?: string): string {
  if (!name || typeof name !== "string") return "??";

  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ─────────────────────────────────────────────
   GPA Color + Label (Optimized for Light UI)
───────────────────────────────────────────── */
export type GpaMeta = {
  stroke: string;
  text: string;
  bg: string;
  label: string;
};

export function gpaColor(gpa: number): GpaMeta {
  if (gpa >= 3.5) {
    return {
      stroke: "#059669", // emerald-600
      text: "#065f46",   // emerald-800
      bg: "#ecfdf5",     // emerald-50
      label: "Excellent",
    };
  }

  if (gpa >= 3.0) {
    return {
      stroke: "#4f46e5", // indigo-600
      text: "#3730a3",   // indigo-800
      bg: "#eef2ff",     // indigo-50
      label: "Good",
    };
  }

  if (gpa >= 2.5) {
    return {
      stroke: "#d97706", // amber-600
      text: "#92400e",   // amber-800
      bg: "#fffbeb",     // amber-50
      label: "Average",
    };
  }

  return {
    stroke: "#dc2626", // red-600
    text: "#7f1d1d",   // red-800
    bg: "#fef2f2",     // red-50
    label: "Below Avg",
  };
}

/* ─────────────────────────────────────────────
   Avatar Color Palette (Light UI Friendly)
───────────────────────────────────────────── */
export const AVATAR_PALETTE: [string, string][] = [
  ["#eef2ff", "#3730a3"], // indigo
  ["#ecfdf5", "#065f46"], // green
  ["#fff7ed", "#9a3412"], // orange
  ["#f5f3ff", "#5b21b6"], // purple
  ["#ecfeff", "#155e75"], // cyan
];

/* ─────────────────────────────────────────────
   Generate Avatar Colors from Name
───────────────────────────────────────────── */
export function avatarColors(name?: string): [string, string] {
  const index =
    typeof name === "string" && name.length > 0
      ? name.charCodeAt(0) % AVATAR_PALETTE.length
      : 0;

  return AVATAR_PALETTE[index];
}