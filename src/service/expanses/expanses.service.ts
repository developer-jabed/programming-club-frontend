/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";

// ─────────────────────────────────────────────────────────────
// Types (mirror expenses.interface.ts on the backend)
// ─────────────────────────────────────────────────────────────
export type ExpenseStatus = "RECORDED" | "VOIDED";

export interface ExpenseQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: ExpenseStatus;
  categoryId?: string;
  projectId?: string;
  sectorId?: string;
  year?: number | string;
  month?: number | string;
}

export interface CreateExpensePayload {
  categoryId: string;
  title: string;
  description: string;
  amount: number; // whole taka, >= 1
  spentAt?: string; // ISO date
  paidTo?: string;
  receiptUrl?: string;
  projectId?: string;
  sectorId?: string;
}

export interface CategoryPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

type ActionResult<T = any> =
  | { success: true; data: T; message?: string; meta?: any; extra?: any }
  | { success: false; message: string; data: null; errors?: any };

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const failMessage = (error: any) =>
  process.env.NODE_ENV === "development"
    ? error?.message
    : "Something went wrong";

const buildQuery = (params: Record<string, unknown> = {}) => {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
};

const json = (body: unknown) => ({
  body: JSON.stringify(body),
  headers: { "Content-Type": "application/json" },
});

// Everything that shows expense / fund data is refreshed after a write.
// (Next 16: revalidateTag(tag, "max"). Next 15: revalidateTag(tag).)
const bust = () => {
  for (const tag of ["expenses", "expense-categories", "fund-summary"]) {
    revalidateTag(tag, "max");
  }
};

async function read<T = any>(
  path: string,
  tags: string[],
  revalidate: number,
  fallbackMessage: string,
  emptyData: any = null,
): Promise<ActionResult<T>> {
  try {
    const response = await serverFetch.get(path, {
      next: { tags, revalidate },
    });
    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: result.message,
        meta: result.meta,
        // totalAmount etc. returned beside data by getExpenses
        extra: result.totalAmount !== undefined
          ? { totalAmount: result.totalAmount }
          : undefined,
      };
    }
    return {
      success: false,
      message: result.message || fallbackMessage,
      data: emptyData,
    };
  } catch (error: any) {
    console.error(`[expenses] ${path}`, error);
    return { success: false, message: failMessage(error), data: emptyData };
  }
}

async function write<T = any>(
  method: "post" | "patch" | "delete",
  path: string,
  body: unknown,
  fallbackMessage: string,
): Promise<ActionResult<T>> {
  try {
    const response =
      method === "delete"
        ? await serverFetch.delete(path)
        : await serverFetch[method](path, json(body));
    const result = await response.json();

    if (result.success) {
      bust();
      return { success: true, data: result.data, message: result.message };
    }
    return {
      success: false,
      message: result.message || fallbackMessage,
      data: null,
      errors: result.errorSources ?? result.errors,
    };
  } catch (error: any) {
    console.error(`[expenses] ${method} ${path}`, error);
    return { success: false, message: failMessage(error), data: null };
  }
}

// ═════════════════════════════════════════════════════════════
// Categories
// ═════════════════════════════════════════════════════════════
export async function getExpenseCategories(includeInactive = false) {
  return read(
    `/expenses/categories${buildQuery({
      includeInactive: includeInactive ? "true" : undefined,
    })}`,
    ["expense-categories"],
    300,
    "Failed to fetch categories",
    [],
  );
}

export async function createExpenseCategory(payload: {
  name: string;
  description?: string;
}) {
  return write("post", "/expenses/categories", payload, "Failed to create category");
}

export async function updateExpenseCategory(id: string, payload: CategoryPayload) {
  return write(
    "patch",
    `/expenses/categories/${id}`,
    payload,
    "Failed to update category",
  );
}

// ═════════════════════════════════════════════════════════════
// Expenses
// ═════════════════════════════════════════════════════════════
export async function getExpenses(params: ExpenseQueryParams = {}) {
  return read(
    `/expenses${buildQuery(params as Record<string, unknown>)}`,
    ["expenses"],
    30,
    "Failed to fetch expenses",
    [],
  );
}

export async function getExpenseById(id: string) {
  return read(`/expenses/${id}`, ["expenses"], 30, "Failed to fetch expense");
}

export async function recordExpense(payload: CreateExpensePayload) {
  return write("post", "/expenses", payload, "Failed to record expense");
}

export async function voidExpense(id: string, reason: string) {
  return write("patch", `/expenses/${id}/void`, { reason }, "Failed to void expense");
}

// ═════════════════════════════════════════════════════════════
// Fund summary (balance, spending by category, 12-month chart)
// ═════════════════════════════════════════════════════════════
export async function getFundSummary(year?: number | string) {
  return read(
    `/expenses/summary${buildQuery({ year })}`,
    ["fund-summary"],
    60,
    "Failed to fetch fund summary",
  );
}