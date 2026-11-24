/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";

const BASE = "/fees";

// ─────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────
const errMsg = (error: any, fallback: string) =>
  process.env.NODE_ENV === "development" ? error.message : fallback;

type Params = Record<string, string | number | boolean | null | undefined>;

/** Accepts a ready query string or a params object; empty values are dropped. */
const toQuery = (q?: string | Params) => {
  if (!q) return "";
  if (typeof q === "string") return q ? `?${q}` : "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
};

const jsonInit = (payload: unknown) => ({
  body: JSON.stringify(payload),
  headers: { "Content-Type": "application/json" },
});

/**
 * Safe JSON parse: an empty or non-JSON body returns null instead of throwing,
 * so the caller can show the real HTTP status.
 */
const parse = async (response: Response): Promise<any | null> => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const badResponse = (response: Response, result: any, fallback: string) =>
  result?.message || `${fallback} (status ${response.status})`;

/**
 * Caching policy:
 *  - User-scoped data (dues, payments, summaries) is `no-store`.
 *  - Active categories are cached for 5 minutes.
 */
const NO_STORE = { cache: "no-store" as const };

/** Refresh Next's caches + client router cache after a write. */
const touch = (...tags: string[]) => {
  for (const t of new Set(["fees", ...tags])) revalidateTag(t, "max");
};

async function getList(
  path: string,
  query: string | Params | undefined,
  init: any,
  label: string
) {
  try {
    const response = await serverFetch.get(
      `${BASE}${path}${toQuery(query)}`,
      init
    );
    const result = await parse(response);

    if (result?.success) {
      return { success: true, data: result.data ?? [], meta: result.meta };
    }
    console.error(`[fees:${label}] bad response`, response.status, result);
    return {
      success: false,
      message: badResponse(response, result, `Failed to fetch ${label}`),
      data: [],
    };
  } catch (error: any) {
    console.error(`[fees:${label}]`, error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong"),
      data: [],
    };
  }
}

async function getOne(
  path: string,
  init: any,
  label: string,
  empty: any = null
) {
  try {
    const response = await serverFetch.get(`${BASE}${path}`, init);
    const result = await parse(response);

    if (result?.success) return { success: true, data: result.data };
    console.error(`[fees:${label}] bad response`, response.status, result);
    return {
      success: false,
      message: badResponse(response, result, `Failed to fetch ${label}`),
      data: empty,
    };
  } catch (error: any) {
    console.error(`[fees:${label}]`, error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong"),
      data: empty,
    };
  }
}

async function mutate(
  method: "post" | "patch" | "delete",
  path: string,
  payload: unknown,
  opts: { ok: string; fail: string; label: string; tags?: string[] }
) {
  try {
    const response = await (serverFetch as any)[method](
      `${BASE}${path}`,
      payload === undefined ? undefined : jsonInit(payload)
    );
    const result = await parse(response);

    if (result?.success) {
      touch(...(opts.tags ?? []));
      return {
        success: true,
        message: result.message || opts.ok,
        data: result.data,
      };
    }
    console.error(`[fees:${opts.label}] bad response`, response.status, result);
    return {
      success: false,
      message: badResponse(response, result, opts.fail),
      errors: result?.errors || {},
    };
  } catch (error: any) {
    console.error(`[fees:${opts.label}]`, error);
    return {
      success: false,
      message: errMsg(error, "Something went wrong. Please try again."),
    };
  }
}

const fail = (message: string, errors: Record<string, string>) => ({
  success: false,
  message,
  errors,
});

// ═════════════════════════════════════════════════════════════
// CATEGORIES
// ═════════════════════════════════════════════════════════════

export async function getFeeCategories(includeInactive = false) {
  return getList(
    "/categories",
    includeInactive ? { includeInactive: true } : undefined,
    includeInactive
      ? NO_STORE
      : { next: { revalidate: 300, tags: ["fee-categories", "fees"] } },
    "categories"
  );
}

export async function createFeeCategory(input: {
  name: string;
  description?: string;
  type?: "MONTHLY" | "ONE_TIME";
  amount?: number;
}) {
  if (!input.name?.trim())
    return fail("Name is required", { name: "Name is required" });
  return mutate("post", "/categories", input, {
    ok: "Category created!",
    fail: "Failed to create category",
    label: "createCategory",
    tags: ["fee-categories"],
  });
}

export async function updateFeeCategory(
  id: string,
  input: {
    name?: string;
    description?: string | null;
    amount?: number;
    isActive?: boolean;
  }
) {
  if (Object.keys(input).length === 0) return fail("Nothing to update", {});
  return mutate("patch", `/categories/${id}`, input, {
    ok: "Category updated!",
    fail: "Failed to update category",
    label: "updateCategory",
    tags: ["fee-categories"],
  });
}

// ═════════════════════════════════════════════════════════════
// DUES
// ═════════════════════════════════════════════════════════════

export async function getFeeDues(query?: string | Params) {
  return getList("/dues", query, NO_STORE, "dues");
}

export async function generateMonthlyDues(input: {
  categoryId: string;
  year: number;
  month: number;
  dueDate?: string;
  group?: string;
  semester?: number;
}) {
  const errors: Record<string, string> = {};
  if (!input.categoryId) errors.categoryId = "Category is required";
  if (!input.year) errors.year = "Year is required";
  if (!input.month || input.month < 1 || input.month > 12)
    errors.month = "Month must be 1-12";
  if (Object.keys(errors).length) return fail("Please fix the errors", errors);

  return mutate("post", "/dues/generate-monthly", input, {
    ok: "Monthly dues generated!",
    fail: "Failed to generate monthly dues",
    label: "generateMonthlyDues",
  });
}

export async function createFeeDues(input: {
  categoryId: string;
  title?: string;
  amount?: number;
  dueDate?: string;
  note?: string;
  userIds?: string[];
  group?: string;
  semester?: number;
}) {
  if (!input.categoryId) {
    return fail("Category is required", { categoryId: "Category is required" });
  }
  return mutate("post", "/dues", input, {
    ok: "Dues created!",
    fail: "Failed to create dues",
    label: "createDues",
  });
}

export async function waiveFeeDue(id: string, note?: string) {
  return mutate("patch", `/dues/${id}/waive`, note ? { note } : {}, {
    ok: "Due waived!",
    fail: "Failed to waive due",
    label: "waiveDue",
  });
}

export async function deleteFeeDue(id: string) {
  return mutate("delete", `/dues/${id}`, undefined, {
    ok: "Due deleted!",
    fail: "Failed to delete due",
    label: "deleteDue",
  });
}

// ═════════════════════════════════════════════════════════════
// PAYMENTS
// ═════════════════════════════════════════════════════════════

export async function getFeePayments(query?: string | Params) {
  return getList("/payments", query, NO_STORE, "payments");
}

export async function getFeePaymentById(id: string) {
  return getOne(`/payments/${id}`, NO_STORE, "payment");
}

export async function recordFeePayment(input: {
  dueId?: string;
  userId?: string;
  categoryId?: string;
  amount: number;
  paidAt?: string;
  note?: string;
}) {
  const errors: Record<string, string> = {};
  if (!Number.isInteger(input.amount) || input.amount < 1) {
    errors.amount = "Enter a valid amount";
  }
  if (!input.dueId && !(input.userId && input.categoryId)) {
    errors.dueId = "Select a due, or a member and category";
  }
  if (Object.keys(errors).length) return fail("Please fix the errors", errors);

  return mutate("post", "/payments", input, {
    ok: "Payment recorded!",
    fail: "Failed to record payment",
    label: "recordPayment",
  });
}

export async function voidFeePayment(id: string, reason: string) {
  if (!reason || reason.trim().length < 3) {
    return fail("Reason is required", {
      reason: "Enter at least 3 characters",
    });
  }
  return mutate(
    "patch",
    `/payments/${id}/void`,
    { reason: reason.trim() },
    {
      ok: "Payment voided!",
      fail: "Failed to void payment",
      label: "voidPayment",
    }
  );
}

// ═════════════════════════════════════════════════════════════
// SUMMARIES
// ═════════════════════════════════════════════════════════════

export async function getFeeSummary(query?: {
  year?: number;
  month?: number;
}) {
  return getOne(
    `/summary${toQuery(query)}`,
    NO_STORE,
    "summary",
    {
      collected: 0,
      paymentCount: 0,
      totalDue: 0,
      outstanding: 0,
      overdueCount: 0,
      dues: {},
    }
  );
}

export async function getMyFeeSummary() {
  return getOne("/my-summary", NO_STORE, "my summary", {
    totalDue: 0,
    totalPaid: 0,
    outstanding: 0,
    upcoming: [],
  });
}