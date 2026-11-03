"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Users, Tag, FolderOpen } from "lucide-react";

interface Props {
  projects: any[];
  sectors: any[];
}

export default function ProjectsClient({ projects, sectors }: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sectorId, setSectorId] = useState("ALL");

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        !search ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = status === "ALL" || p.status === status;
      const matchSector = sectorId === "ALL" || p.sectorId === sectorId;
      return matchSearch && matchStatus && matchSector;
    });
  }, [projects, search, status, sectorId]);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="ALL">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="DRAFT">Draft</option>
        </select>
        <select
          value={sectorId}
          onChange={(e) => setSectorId(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="ALL">All Sectors</option>
          {sectors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground text-sm">No projects found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {p.title}
                </h3>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
                {p.description || "No description provided"}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {p.members?.length ?? 0}
                  {p.maxMembers ? ` / ${p.maxMembers}` : ""}
                </span>
                <div className="flex gap-1">
                  {(p.tags || []).slice(0, 2).map((t: string) => (
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    OPEN: "bg-primary/15 text-primary border-primary/25",
    IN_PROGRESS: "bg-accent/15 text-accent border-accent/25",
    COMPLETED: "bg-muted text-muted-foreground border-border",
    DRAFT: "bg-muted text-muted-foreground border-border",
    ARCHIVED: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
        map[status] || map.DRAFT
      }`}
    >
      {status?.replace("_", " ")}
    </span>
  );
}
