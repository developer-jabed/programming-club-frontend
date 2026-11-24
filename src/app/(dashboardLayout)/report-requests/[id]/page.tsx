/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, MessageSquare, User2 } from "lucide-react";
import { notFound } from "next/navigation";
import { getUserInfo } from "@/service/auth/getUserInfo";
import { getFeatureRequestById } from "@/service/features/features.service";
import VoteButton from "@/components/modules/Features/MemberFeatures/VoteButton";
import ReplyForm from "@/components/modules/Features/MemberFeatures/ReplyForm";
import DeleteRequestButton from "@/components/modules/Features/MemberFeatures/deleteRequestModel";

export const dynamic = "force-dynamic";

const badge: Record<string, string> = {
  OPEN: "bg-muted text-muted-foreground",
  PLANNED: "bg-blue-500/10 text-blue-600",
  IN_PROGRESS: "bg-amber-500/10 text-amber-600",
  COMPLETED: "bg-green-500/10 text-green-600",
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
  return Number.isNaN(date.getTime())
    ? ""
    : format(date, "MMM d, yyyy • HH:mm");
};

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, res] = await Promise.all([
    getUserInfo(),
    getFeatureRequestById(id),
  ]);

  if (!res.success || !res.data) notFound();

  const r = res.data;
  const replies = (r.replies ?? []).filter((rep: any) => !rep.deletedAt);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        href="/report-requests"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to requests
      </Link>

      {/* Main request card */}
      <article className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{r.title}</h1>
              {r.status && (
                <span className={pill(r.status)}>
                  {String(r.status).replace("_", " ")}
                </span>
              )}
              {r.priority && (
                <span className={pill(r.priority)}>{r.priority}</span>
              )}
            </div>

            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {r.description}
            </p>

            {r.adminNote && (
              <div className="rounded-xl bg-primary/5 px-4 py-3 text-sm">
                <span className="font-semibold">Team note: </span>
                {r.adminNote}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <VoteButton
              requestId={r.id}
              initialVotes={r.votes ?? 0}
              initialHasVoted={!!r.hasVoted}
              disabled={!user?.id}
            />
            {user?.id && r.createdBy?.id === user.id && (
              <DeleteRequestButton id={r.id} />
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
          {r.createdBy?.name && (
            <span className="inline-flex items-center gap-1.5">
              <User2 className="h-3.5 w-3.5" />
              {r.createdBy.name}
            </span>
          )}
          <span>{fmt(r.createdAt)}</span>
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            {replies.length} replies
          </span>
        </div>
      </article>

      {/* Discussion */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Discussion ({replies.length})
        </h2>

        {user?.id ? (
          <div className="rounded-2xl border border-border bg-card p-5">
            <ReplyForm featureRequestId={r.id} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="underline">
              Log in
            </Link>{" "}
            to join the discussion.
          </p>
        )}

        {replies.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No replies yet. Be the first!
          </p>
        ) : (
          <ul className="space-y-3">
            {replies.map((rep: any) => (
              <li
                key={rep.id}
                className={`rounded-2xl border border-border bg-card p-4 ${
                  rep.isAdminReply ? "border-primary/30 bg-primary/5" : ""
                }`}
              >
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {rep.author?.name ?? "User"}
                  </span>
                  {rep.isAdminReply && (
                    <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      TEAM
                    </span>
                  )}
                  <span>·</span>
                  <span>{fmt(rep.createdAt)}</span>
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed">
                  {rep.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}