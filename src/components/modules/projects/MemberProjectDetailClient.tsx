"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  handleProjectMember,
  requestJoinProject,
} from "@/service/project/project.service";
import { sendMessage } from "@/service/chat/chat.service";
import {
  Users,
  Tag,
  Send,
  Loader2,
  MessageSquare,
  Check,
  X,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge, type Project } from "./ProjectFormFields";

interface Props {
  project: Project;
  messages: any[];
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/60 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pt-0.5">
        {label}
      </span>
      <span className="text-sm text-foreground text-right break-words max-w-[65%]">
        {children}
      </span>
    </div>
  );
}

export default function MemberProjectDetailClient({
  project,
  messages: initialMessages,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [messages, setMessages] = useState<any[]>(initialMessages || []);
  const [content, setContent] = useState("");

  const [isSending, startSend] = useTransition();
  const [isJoining, startJoin] = useTransition();
  const [busyMember, setBusyMember] = useState<string | null>(null);

  const members: any[] = project.members || [];
  const pending = members.filter((m) => m.status === "PENDING");
  const active = members.filter((m) => !m.status || m.status === "ACTIVE");

  const listPath = pathname.split("/").slice(0, -1).join("/") || "/";

  const handleSend = () => {
    if (!content.trim()) return;
    const formData = new FormData();
    formData.set("content", content);
    startSend(async () => {
      const res = await sendMessage(project.id, null, formData);
      if (res.success) {
        setContent("");
        if (res.data) setMessages((prev) => [...prev, res.data]);
      } else {
        toast.error(res.message || "Failed to send");
      }
    });
  };

  const handleMember = async (
    memberId: string,
    status: "ACTIVE" | "REJECTED" | "LEFT"
  ) => {
    setBusyMember(memberId);
    const res = await handleProjectMember(project.id, memberId, status);
    setBusyMember(null);

    if (res.success) {
      toast.success(res.message || "Member updated");
      router.refresh();
    } else {
      toast.error(res.message || "Failed to update member");
    }
  };

  const handleJoinRequest = () => {
    startJoin(async () => {
      const res = await requestJoinProject(project.id);
      if (res.success) {
        toast.success(res.message || "Join request sent!");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to send join request");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={project.status} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded-md px-1.5 py-0.5">
                {project.isPublic === false ? "Private" : "Public"}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {project.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              {project.description || "No description"}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {active.length}
                {project.maxMembers ? ` / ${project.maxMembers}` : ""} members
              </span>
              {(project.tags || []).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary px-1.5 py-0.5"
                >
                  <Tag className="h-3 w-3" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={handleJoinRequest}
              disabled={isJoining}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:brightness-110 disabled:opacity-60 transition"
            >
              {isJoining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Request to Join
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Details */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-2">Details</h2>
          <Row label="Sector">{project.sector?.name || "—"}</Row>
          <Row label="Max Members">{project.maxMembers ?? "No limit"}</Row>
          <Row label="Start Date">{formatDate(project.startDate)}</Row>
          <Row label="End Date">{formatDate(project.endDate)}</Row>
          <Row label="Created">{formatDate(project.createdAt)}</Row>
          <Row label="Updated">{formatDate(project.updatedAt)}</Row>
        </div>

        {/* Members */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold">Members</h2>

          {/* Pending requests – backend decides if current user can approve */}
          {pending.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pending requests ({pending.length})
              </p>
              {pending.map((m) => {
                const user = m.user ?? m;
                const busy = busyMember === m.id;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.name || "Unnamed"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        disabled={busy}
                        onClick={() => handleMember(m.id, "ACTIVE")}
                        className="rounded-lg p-2 text-primary hover:bg-primary/10 disabled:opacity-50"
                        title="Accept"
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => handleMember(m.id, "REJECTED")}
                        className="rounded-lg p-2 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                        title="Reject"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active ({active.length})
            </p>
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet.</p>
            ) : (
              active.map((m) => {
                const user = m.user ?? m;
                const busy = busyMember === m.id;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.name || "Unnamed"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <button
                      disabled={busy}
                      onClick={() => handleMember(m.id, "LEFT")}
                      className="rounded-lg p-2 text-destructive hover:bg-destructive/10 disabled:opacity-50 shrink-0"
                      title="Remove from project"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserMinus className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Project Chat</h2>
        </div>
        <div className="h-72 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No messages yet
            </p>
          ) : (
            messages.map((m: any) => (
              <div key={m.id} className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {m.sender?.name?.[0] || "?"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {m.sender?.name || "User"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {m.createdAt
                        ? new Date(m.createdAt).toLocaleTimeString()
                        : ""}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {m.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2 p-4 border-t border-border">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={handleSend}
            disabled={isSending || !content.trim()}
            className="rounded-xl bg-primary text-primary-foreground p-2.5 hover:brightness-110 disabled:opacity-50 transition"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}