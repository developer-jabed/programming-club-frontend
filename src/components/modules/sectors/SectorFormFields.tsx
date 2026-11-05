export interface Sector {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  order?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: { members?: number };
}

const labelCls =
  "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";
const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function SectorFormFields({ sector }: { sector?: Sector }) {
  return (
    <>
      <div className="space-y-1.5">
        <label className={labelCls}>Name *</label>
        <input
          name="name"
          required
          minLength={2}
          defaultValue={sector?.name}
          placeholder="e.g. Web Development"
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Slug</label>
        <input
          name="slug"
          defaultValue={sector?.slug}
          placeholder="auto-generated if empty"
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Description</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={sector?.description ?? ""}
          placeholder="What is this sector about?"
          className={`${inputCls} resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelCls}>Icon</label>
          <input
            name="icon"
            defaultValue={sector?.icon ?? ""}
            placeholder="🚀"
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Color</label>
          <input
            name="color"
            type="color"
            defaultValue={sector?.color || "#10b981"}
            className="w-full h-[38px] rounded-xl border border-border bg-background px-1 cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelCls}>Order</label>
          <input
            name="order"
            type="number"
            min={0}
            defaultValue={sector?.order ?? 0}
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Status</label>
          <select
            name="isActive"
            defaultValue={sector?.isActive === false ? "false" : "true"}
            className={inputCls}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>
    </>
  );
}