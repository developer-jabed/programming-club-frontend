/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  status?: string;
  isPublic?: boolean;
  maxMembers?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  tags?: string[];
  sectorId?: string | null;
  sector?: { id: string; name: string } | null;
  members?: any[];
  _count?: { members?: number };
  createdAt?: string;
  updatedAt?: string;
}

export const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

const labelCls =
  "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";
const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition";

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : "");

export function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    OPEN: "bg-primary/15 text-primary border-primary/25",
    IN_PROGRESS: "bg-accent/15 text-accent border-accent/25",
    COMPLETED: "bg-muted text-muted-foreground border-border",
    DRAFT: "bg-muted text-muted-foreground border-border",
  };
  const key = status || "OPEN";
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
        map[key] || map.OPEN
      }`}
    >
      {key.replace("_", " ")}
    </span>
  );
}

export default function ProjectFormFields({
  project,
  sectors,
}: {
  project?: Project;
  sectors: { id: string; name: string }[];
}) {
  return (
    <>
      <div className="space-y-1.5">
        <label className={labelCls}>
          Title <span className="text-destructive">*</span>
        </label>
        <input
          name="title"
          required
          defaultValue={project?.title}
          placeholder="Awesome project name"
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Description</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={project?.description ?? ""}
          placeholder="What is this project about?"
          className={`${inputCls} resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelCls}>Status</label>
          <select
            name="status"
            defaultValue={project?.status || "OPEN"}
            className={inputCls}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Sector</label>
          <select
            name="sectorId"
            defaultValue={project?.sectorId ?? ""}
            className={inputCls}
          >
            <option value="">None</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelCls}>Max Members</label>
          <input
            name="maxMembers"
            type="number"
            min={1}
            defaultValue={project?.maxMembers ?? ""}
            placeholder="Optional"
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Visibility</label>
          <select
            name="isPublic"
            defaultValue={project?.isPublic === false ? "false" : "true"}
            className={inputCls}
          >
            <option value="true">Public</option>
            <option value="false">Private</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelCls}>Start Date</label>
          <input
            name="startDate"
            type="date"
            defaultValue={toDateInput(project?.startDate)}
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>End Date</label>
          <input
            name="endDate"
            type="date"
            defaultValue={toDateInput(project?.endDate)}
            className={inputCls}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Tags</label>
        <input
          name="tags"
          defaultValue={(project?.tags || []).join(", ")}
          placeholder="react, node, api"
          className={inputCls}
        />
      </div>
    </>
  );
}