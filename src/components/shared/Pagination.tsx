"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  /** Query param name to update, defaults to "page" */
  paramName?: string;
  /** Optional label shown before the total count, e.g. "মোট" */
  totalLabel?: string;
}

export function Pagination({
  page,
  totalPages,
  total,
  paramName = "page",
  totalLabel = "মোট",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const goToPage = (target: number) => {
    if (target < 1 || target > totalPages || target === page) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, String(target));
    router.push(`${pathname}?${params.toString()}`);
  };

  // Build a compact page-number list: first, last, current ±1, with ellipses
  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    const add = (p: number) => pages.push(p);

    add(1);
    if (page > 3) pages.push("ellipsis");

    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
      add(p);
    }

    if (page < totalPages - 2) pages.push("ellipsis");
    if (totalPages > 1) add(totalPages);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col items-center gap-3 py-2 sm:flex-row sm:justify-between">
      <p className="text-xs text-slate-400">
        পেজ {page} / {totalPages} · {totalLabel} {total.toLocaleString("en-BD")} টি
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="পূর্ববর্তী পেজ"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pageNumbers.map((p, i) =>
          p === "ellipsis" ? (
            <span
              key={`ellipsis-${i}`}
              className="flex h-8 w-8 items-center justify-center text-xs text-slate-300"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => goToPage(p)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
                p === page
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="পরবর্তী পেজ"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}