"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { memo, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  deleteProject,
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
  Pencil,
  Trash2,
  Check,
  X,
  UserMinus,
  UserPlus,
  Clock,
  CheckCircle2,
  Lock,
  Calendar,
  CheckSquare,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import EditProjectModal from "./EditProjectModal";
import { StatusBadge, type Project } from "./ProjectFormFields";
import {
  getMyMembership,
  getOwnerId,
  isProjectOwner,
} from "@/service/project/project-access";

interface Props {
  project: Project;
  messages: any[];
  sectors?: { id: string; name: string }[];
  tasks?: any[];
  currentUserId?: string | null;
}

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Dhaka",
});

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "—" : DATE_FMT.format(d);
}

function formatTime(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : TIME_FMT.format(d);
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

// ─────────────────────────────────────────────────────────────
// Chat bubble
// ─────────────────────────────────────────────────────────────
const MessageBubble = memo(function MessageBubble({
  message,
  mine,
}: {
  message: any;
  mine: boolean;
}) {
  const name = message.sender?.name || "User";

  return (
    <div className={`flex gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}>
      {!mine && (
        <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
          {name[0] || "?"}
        </div>
      )}

      <div
        className={`flex max-w-[75%] flex-col ${
          mine ? "items-end" : "items-start"
        }`}
      >
        {!mine && (
          <span className="mb-0.5 px-1 text-[11px] font-medium text-muted-foreground">
            {name}
          </span>
        )}

        <div
          className={`break-words whitespace-pre-wrap px-3.5 py-2 text-sm ${
            mine
              ? "rounded-2xl rounded-br-md bg-primary text-primary-foreground"
              : "rounded-2xl rounded-bl-md bg-muted text-foreground"
          } ${message.pending ? "opacity-70" : ""}`}
        >
          {message.content}
        </div>

        <span className="mt-0.5 px-1 text-[10px] text-muted-foreground">
          {message.pending ? "Sending..." : formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// Priority indicator
// ─────────────────────────────────────────────────────────────
function PriorityDot({ priority }: { priority?: string }) {
  const c: Record<string, string> = {
    URGENT: "bg-destructive shadow-[0_0_8px] shadow-destructive/50",
    HIGH: "bg-accent shadow-[0_0_8px] shadow-accent/40",
    MEDIUM: "bg-primary",
    LOW: "bg-muted-foreground",
  };
  return (
    <span
      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
        c[priority || "MEDIUM"] || c.MEDIUM
      }`}
    />
  );
}

export default function ProjectDetailClient({
  project,
  messages: initialMessages,
  sectors = [],
  tasks = [],
  currentUserId,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [messages, setMessages] = useState<any[]>(() =>
    [...(initialMessages || [])].sort(
      (a, b) =>
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime()
    )
  );
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [isDeleting, startDelete] = useTransition();
  const [isJoining, startJoin] = useTransition();
  const [busyMember, setBusyMember] = useState<string | null>(null);

  const chatRef = useRef<HTMLDivElement>(null);

  // ── Access ──────────────────────────────────────────────
  const isOwner = isProjectOwner(project, currentUserId);
  const myMembership = getMyMembership(project, currentUserId);
  const myStatus: string | undefined = myMembership?.status;
  const isActiveMember =
    !!myMembership && (!myStatus || myStatus === "ACTIVE");
  const canChat = isOwner || isActiveMember;
  const ownerId = getOwnerId(project);

  const members: any[] = project.members || [];
  const pending = members.filter((m) => m.status === "PENDING");
  const active = members.filter((m) => !m.status || m.status === "ACTIVE");

  const listPath = pathname.split("/").slice(0, -1).join("/") || "/";

  // Auto-scroll chat
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, canChat]);

  const isMine = (m: any) =>
    !!currentUserId &&
    (m.senderId === currentUserId || m.sender?.id === currentUserId);

  // ── Actions ─────────────────────────────────────────────
  const handleSend = async () => {
    const text = content.trim();
    if (!text || !currentUserId) return;

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        content: text,
        senderId: currentUserId,
        createdAt: new Date().toISOString(),
        pending: true,
      },
    ]);
    setContent("");

    const rollback = (message?: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setContent(text);
      toast.error(message || "Failed to send");
    };

    try {
      const formData = new FormData();
      formData.set("content", text);
      const res = await sendMessage(project.id, null, formData);

      if (res.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? res.data
                ? { ...res.data, senderId: res.data.senderId ?? currentUserId }
                : { ...m, pending: false }
              : m
          )
        );
      } else {
        rollback(res.message);
      }
    } catch {
      rollback();
    }
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

  const handleDelete = () => {
    startDelete(async () => {
      const res = await deleteProject(project.id);
      if (res.success) {
        toast.success(res.message || "Project deleted!");
        router.push(listPath);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to delete project");
      }
    });
  };

  // ── Header actions ──────────────────────────────────────
  const renderHeaderActions = () => {
    if (isOwner) {
      return (
        <>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 text-destructive px-4 py-2 text-sm font-medium hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </>
      );
    }

    if (isActiveMember) {
      return (
        <span className="inline-flex items-center gap-2 rounded-xl bg-primary/10 text-primary px-4 py-2 text-sm font-medium">
          <CheckCircle2 className="h-4 w-4" />
          You are a member
        </span>
      );
    }

    if (myStatus === "PENDING") {
      return (
        <span className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground">
          <Clock className="h-4 w-4" />
          Request sent
        </span>
      );
    }

    if (myStatus === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive">
          Your request was rejected
        </span>
      );
    }

    return (
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
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={project.status} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded-md px-1.5 py-0.5">
                {project.isPublic === false ? "Private" : "Public"}
              </span>
              {isOwner && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-md px-1.5 py-0.5">
                  My project
                </span>
              )}
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
            {renderHeaderActions()}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Details ──────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-2">Details</h2>
          <Row label="Sector">{project.sector?.name || "—"}</Row>
          <Row label="Max Members">{project.maxMembers ?? "No limit"}</Row>
          <Row label="Start Date">{formatDate(project.startDate)}</Row>
          <Row label="End Date">{formatDate(project.endDate)}</Row>
          <Row label="Created">{formatDate(project.createdAt)}</Row>
          <Row label="Updated">{formatDate(project.updatedAt)}</Row>
        </div>

        {/* ── Members ──────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold">Members</h2>

          {isOwner && pending.length > 0 && (
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
                const memberUserId = m.userId ?? m.user?.id;
                const isMemberOwner = !!ownerId && memberUserId === ownerId;

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.name || "Unnamed"}
                        {isMemberOwner && (
                          <span className="ml-2 text-[10px] font-semibold uppercase text-primary">
                            Owner
                          </span>
                        )}
                      </p>
                      {isOwner && user.email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      )}
                    </div>

                    {isOwner && !isMemberOwner && (
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
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Tasks ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Project Tasks</h2>
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {tasks.length}
            </span>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground">
            <CheckSquare className="mx-auto mb-3 h-8 w-8 opacity-40" />
            No tasks have been assigned to this project yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors"
              >
                <PriorityDot priority={task.priority} />

                <div className="min-w-[180px] flex-1">
                  <h3 className="font-medium text-foreground truncate">
                    {task.title}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {task.status && (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                        {task.status.replaceAll("_", " ")}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                    {task.maxScore != null && (
                      <span>{task.maxScore} pts</span>
                    )}
                    {task.assignee?.name && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {task.assignee.name}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={`/projects/${project.id}/${task.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium hover:bg-muted transition shrink-0"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Chat ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Project Chat</h2>
        </div>

        {canChat ? (
          <>
            <div
              ref={chatRef}
              className="h-72 overflow-y-auto p-4 space-y-3"
            >
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No messages yet
                </p>
              ) : (
                messages.map((m: any) => (
                  <MessageBubble key={m.id} message={m} mine={isMine(m)} />
                ))
              )}
            </div>
            <div className="flex gap-2 p-4 border-t border-border">
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={handleSend}
                disabled={!content.trim()}
                className="rounded-xl bg-primary text-primary-foreground p-2.5 hover:brightness-110 disabled:opacity-50 transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center text-sm text-muted-foreground">
            <Lock className="h-5 w-5" />
            You need to be a project member to view and send messages.
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────── */}
      {isOwner && editing && (
        <EditProjectModal
          project={project}
          sectors={sectors}
          onClose={() => setEditing(false)}
        />
      )}

      {isOwner && confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={isDeleting ? undefined : () => setConfirmDelete(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="h-1 bg-destructive" />
            <div className="p-5 space-y-3">
              <h2 className="font-semibold text-lg">Delete project?</h2>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {project.title}
                </span>{" "}
                will be permanently deleted. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                  className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 rounded-xl bg-destructive text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}