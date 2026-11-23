// Mirrors your Prisma schema + fee.service.ts select shapes.

export type DueStatus = "UNPAID" | "PARTIAL" | "PAID" | "WAIVED";
export type PaymentStatus = "RECEIVED" | "VOIDED";
export type CategoryType = "MONTHLY" | "ONE_TIME";

export type Meta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  type: CategoryType;
  amount: number; // default amount in BDT
  isActive: boolean;
};

// userBrief in the service
export type UserBrief = {
  id: string;
  name?: string | null;
  roll?: string | null;
  group?: string | null;
  semester?: number | null;
  profilePicture?: string | null;
};

type CategoryBrief = { id: string; name: string; type: CategoryType };

export type Due = {
  id: string;
  title?: string | null;
  year?: number | null;
  month?: number | null;
  amount: number;
  paidAmount: number;
  status: DueStatus;
  dueDate?: string | null;
  note?: string | null;
  createdAt: string;
  user: UserBrief;
  category: CategoryBrief;
};

export type Payment = {
  id: string;
  receiptNo: number;
  receipt: string; // "PC-2026-000123" (added by withReceipt)
  amount: number;
  status: PaymentStatus;
  paidAt: string;
  note?: string | null;
  voidedAt?: string | null;
  voidReason?: string | null;
  dueId?: string | null;
  user: UserBrief;
  category: CategoryBrief;
  receivedBy: { id: string; name?: string | null };
  due?: { id: string; year?: number | null; month?: number | null; title?: string | null } | null;
};

export type Summary = {
  collected: number;
  paymentCount: number;
  totalDue: number;
  outstanding: number;
  overdueCount: number;
  dues: Partial<Record<DueStatus, { count: number; amount: number }>>;
};

export const DUE_STATUSES: DueStatus[] = ["UNPAID", "PARTIAL", "PAID", "WAIVED"];
export const PAYMENT_STATUSES: PaymentStatus[] = ["RECEIVED", "VOIDED"];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;