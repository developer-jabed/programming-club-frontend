import { Due } from "./fees.interface";

const TZ = "Asia/Dhaka"; // fixed zone → server and client always render the same text

const money = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: TZ,
});
const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }); // → YYYY-MM-DD

export const fmtMoney = (n?: number | null) => `৳${money.format(n ?? 0)}`;
export const fmtDate = (d?: string | null) => (d ? dateFmt.format(new Date(d)) : "—");
export const todayDhaka = () => ymd.format(new Date());

export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export const periodLabel = (month?: number | null, year?: number | null) =>
  month && year ? `${MONTHS_SHORT[month - 1]} ${year}` : year ? String(year) : null;

export const cn = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

/** Unpaid/partial and past its due date. `now` comes from the server so SSR and client agree. */
export const isOverdue = (d: Pick<Due, "status" | "dueDate">, now: number) =>
  (d.status === "UNPAID" || d.status === "PARTIAL") && !!d.dueDate && new Date(d.dueDate).getTime() < now;

// ─────────────────────────────────────────────────────────────
// Query helpers
// ─────────────────────────────────────────────────────────────
export type SP = Record<string, string | undefined>;

export const flattenSP = (raw: Record<string, string | string[] | undefined>): SP => {
  const out: SP = {};
  for (const [k, v] of Object.entries(raw)) out[k] = Array.isArray(v) ? v[0] : v;
  return out;
};

/** Only whitelisted keys ever reach the backend. */
export const pick = (sp: SP, keys: string[], defaults: Record<string, string> = {}) => {
  const out: Record<string, string> = { ...defaults };
  for (const k of keys) if (sp[k]) out[k] = sp[k]!;
  return out;
};

// Backend filters `paidAt` with gte/lte, so a bare date would drop the whole last day.
const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const dayStart = (d: string) => (DATE.test(d) ? `${d}T00:00:00.000+06:00` : d);
export const dayEnd = (d: string) => (DATE.test(d) ? `${d}T23:59:59.999+06:00` : d);

export const DUES_KEYS = [
  "page", "limit", "sortBy", "order", "categoryId", "status",
  "year", "month", "overdue", "group", "semester", "search",
];
export const PAYMENTS_KEYS = [
  "page", "limit", "sortBy", "order", "categoryId", "status",
  "from", "to", "search", "receiptNo",
];