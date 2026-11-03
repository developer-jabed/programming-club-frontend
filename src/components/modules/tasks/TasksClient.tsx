"use client";

import { useMemo, useState } from "react";
import { Search, CheckSquare, Clock } from "lucide-react";
import { format } from "date-fns";

interface Props {
  tasks: any[];
}

export default function TasksClient({ tasks }: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        !search || t.title?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = status === "ALL" || t.status === status;
      const matchPriority = priority === "ALL" || t.priority === priority;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, search, status, priority]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
        >
          <option value="ALL">All Status</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
        >
          <option value="ALL">All Priority</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground text-sm">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
            >
              <PriorityDot priority={t.priority} />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{t.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <StatusBadge status={t.status} />
                  {t.dueDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(t.dueDate), "MMM d, yyyy")}
                    </span>
                  )}
                  {t.maxScore != null && (
                    <span>{t.maxScore} pts</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const c: Record<string, string> = {
    URGENT: "bg-destructive shadow-[0_0_8px] shadow-destructive/50",
    HIGH: "bg-accent shadow-[0_0_8px] shadow-accent/40",
    MEDIUM: "bg-primary",
    LOW: "bg-muted-foreground",
  };
  return <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${c[priority] || c.MEDIUM}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    TODO: "bg-muted text-muted-foreground",
    IN_PROGRESS: "bg-primary/15 text-primary",
    IN_REVIEW: "bg-accent/15 text-accent",
    COMPLETED: "bg-primary/20 text-primary",
    CANCELLED: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${map[status] || map.TODO}`}>
      {status?.replace("_", " ")}
    </span>
  );
}
