"use client";

import { useState, useTransition } from "react";
import { requestJoinProject } from "@/service/project/project.service";
import { sendMessage } from "@/service/chat/chat.service";
import { Users, Tag, Send, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Props {
  project: any;
  messages: any[];
}

export default function ProjectDetailClient({ project, messages: initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages || []);
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleJoin = () => {
    startTransition(async () => {
      const res = await requestJoinProject(project.id);
      if (res.success) toast.success(res.message || "Request sent!");
      else toast.error(res.message || "Failed");
    });
  };

  const handleSend = () => {
    if (!content.trim()) return;
    const formData = new FormData();
    formData.set("content", content);
    startTransition(async () => {
      const res = await sendMessage(project.id, null, formData);
      if (res.success) {
        setContent("");
        if (res.data) setMessages((prev) => [...prev, res.data]);
        toast.success("Sent");
      } else toast.error(res.message || "Failed");
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
              {project.isPublic && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded-md px-1.5 py-0.5">
                  Public
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              {project.description || "No description"}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {project.members?.length ?? 0}
                {project.maxMembers ? ` / ${project.maxMembers}` : ""} members
              </span>
              {(project.tags || []).map((t: string) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary px-1.5 py-0.5">
                  <Tag className="h-3 w-3" />
                  {t}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={handleJoin}
            disabled={isPending}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:brightness-110 disabled:opacity-60 glow-primary"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Request to Join
          </button>
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
            <p className="text-sm text-muted-foreground text-center py-12">No messages yet</p>
          ) : (
            messages.map((m: any) => (
              <div key={m.id} className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {m.sender?.name?.[0] || "?"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{m.sender?.name || "User"}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ""}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{m.content}</p>
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
            disabled={isPending || !content.trim()}
            className="rounded-xl bg-primary text-primary-foreground p-2.5 hover:brightness-110 disabled:opacity-50 transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    OPEN: "bg-primary/15 text-primary border-primary/25",
    IN_PROGRESS: "bg-accent/15 text-accent border-accent/25",
    COMPLETED: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${map[status] || map.OPEN}`}>
      {status?.replace("_", " ")}
    </span>
  );
}
