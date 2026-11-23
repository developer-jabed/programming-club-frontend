/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { format } from "date-fns";
import { MessageSquare, Pin, Tag, User2 } from "lucide-react";
import { getUserInfo } from "@/service/auth/getUserInfo";
// TODO: adjust to where your feature actions live
import {
  getFeatureRequests,
  getFeatureUpdates,
} from "@/service/features/features.service";

import CreateRequestModal from "@/components/modules/Features/MemberFeatures/CreateRequestModel";
import DeleteRequestButton from "@/components/modules/Features/MemberFeatures/deleteRequestModel";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

type SP = Promise<{ tab?: string; status?: string; page?: string }>;

const STATUS_FILTERS = ["ALL", "PENDING", "PLANNED", "IN_PROGRESS", "DONE", "REJECTED"];

const badge: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  PLANNED: "bg-blue-500/10 text-blue-600",
  IN_PROGRESS: "bg-amber-500/10 text-amber-600",
  DONE: "bg-green-500/10 text-green-600",
  REJECTED: "bg-destructive/10 text-destructive",
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-amber-500/10 text-amber-600",
  HIGH: "bg-destructive/10 text-destructive",
};

const pill = (v: string) =>
  `inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
    badge[v] ?? "bg-primary/10 text-primary"
  }`;

const fmt = (d?: string | null) => {
  if (!d) return "";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "" : format(date, "MMM d, yyyy");
};

const href = (p: { tab: string; status?: string; page?: number }) => {
  const sp = new URLSearchParams({ tab: p.tab });
  if (p.status && p.status !== "ALL") sp.set("status", p.status);
  if (p.page && p.page > 1) sp.set("page", String(p.page));
  return `?${sp.toString()}`;
};

const Page = async ({ searchParams }: { searchParams: SP }) => {
  const sp = await searchParams;
  const tab = sp.tab === "updates" ? "updates" : "requests";
  const status = sp.status ?? "ALL";
  const page = Math.max(1, Number(sp.page) || 1);

  // Build the query for the active tab only
  const q = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  if (tab === "requests" && status !== "ALL") q.set("status", status);

  // Fetch only what this tab needs, in parallel
  const [user, res] = await Promise.all([
    getUserInfo(),
    tab === "requests"
      ? getFeatureRequests(q.toString())
      : getFeatureUpdates(q.toString()),
  ]);

  const items: any[] = res.data ?? [];
  const totalPages: number = res.meta?.totalPage ?? res.meta?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Features & Updates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Request features and follow what the team is building
          </p>
        </div>
        {tab === "requests" && <CreateRequestModal />}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-card p-1 text-sm w-fit">
        {(["requests", "updates"] as const).map((t) => (
          <Link
            key={t}
            href={href({ tab: t })}
            prefetch={false}
            className={`rounded-lg px-4 py-1.5 font-medium capitalize ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t === "requests" ? "Feature requests" : "Updates"}
          </Link>
        ))}
      </div>

      {/* Status filters (requests only) */}
      {tab === "requests" && (
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s}
              href={href({ tab, status: s })}
              prefetch={false}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                status === s
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {s.replace("_", " ")}
            </Link>
          ))}
        </div>
      )}

      {/* Error */}
      {!res.success && (
        <p className="text-sm text-destructive">
          {res.message || "Could not load data."}
        </p>
      )}

      {/* Empty */}
      {res.success && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nothing here yet.
        </div>
      )}

      {/* Requests list */}
      {tab === "requests" && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{r.title}</h2>
                    {r.status && <span className={pill(r.status)}>{String(r.status).replace("_", " ")}</span>}
                    {r.priority && <span className={pill(r.priority)}>{r.priority}</span>}
                  </div>
                  <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">
                    {r.description}
                  </p>
                  {r.adminNote && (
                    <p className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-xs text-foreground">
                      <span className="font-semibold">Team note: </span>
                      {r.adminNote}
                    </p>
                  )}
                </div>
                {user?.id && r.creator?.id === user.id && (
                  <DeleteRequestButton id={r.id} />
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                {r.creator?.name && (
                  <span className="inline-flex items-center gap-1.5">
                    <User2 className="h-3.5 w-3.5" />
                    {r.creator.name}
                  </span>
                )}
                <span>{fmt(r.createdAt)}</span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {r._count?.replies ?? r.replies?.length ?? 0}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Updates list */}
      {tab === "updates" && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((u) => (
            <li
              key={u.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                {u.isPinned && <Pin className="h-4 w-4 text-primary" />}
                <h2 className="font-semibold">{u.title}</h2>
                {u.type && <span className={pill(u.type)}>{u.type}</span>}
                {u.version && (
                  <span className="rounded-md border border-border px-2 py-0.5 text-[11px] font-medium">
                    v{String(u.version).replace(/^v/i, "")}
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-muted-foreground">
                {u.content}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <span>{fmt(u.publishedAt ?? u.createdAt)}</span>
                {u.author?.name && (
                  <span className="inline-flex items-center gap-1.5">
                    <User2 className="h-3.5 w-3.5" />
                    {u.author.name}
                  </span>
                )}
                {Array.isArray(u.tags) &&
                  u.tags.slice(0, 4).map((t: string) => (
                    <span key={t} className="inline-flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {t}
                    </span>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link
              href={href({ tab, status, page: page - 1 })}
              className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={href({ tab, status, page: page + 1 })}
              className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
};

export default Page;