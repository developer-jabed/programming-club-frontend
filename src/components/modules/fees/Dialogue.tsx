// components/modules/fees/Dialogue.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  createFeeCategory,
  createFeeDues,
  deleteFeeDue,
  generateMonthlyDues,
  recordFeePayment,
  updateFeeCategory,
  voidFeePayment,
  waiveFeeDue,
} from "@/service/fees/fees.service";
import { cn, dayStart, fmtMoney, todayDhaka } from "@/types/fees.format";
import { MONTHS, type Category, type Due, type Payment } from "@/types/fees.interface";
import { Field, Modal, btn, inputCls, toast } from "./FeeClient";
import { MemberPicker } from "./MemberPicker";

export { MemberPicker };

// ─────────────────────────────────────────────────────────────
// Shared submit logic: calls a server action, maps `errors` to
// fields, toasts the message, refreshes the page, closes.
// ─────────────────────────────────────────────────────────────
type Result = { success: boolean; message?: string; errors?: Record<string, string> };

function useSubmit(onClose: () => void) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const run = async (action: () => Promise<Result>) => {
    setPending(true);
    setError(undefined);
    setErrors({});
    const res = await action();
    setPending(false);

    if (!res.success) {
      setErrors(res.errors ?? {});
      setError(res.message ?? "Request failed");
      return;
    }
    toast.success(res.message ?? "Done");
    router.refresh();
    onClose();
  };

  const reject = (message: string, fieldErrors: Record<string, string> = {}) => {
    setError(message);
    setErrors(fieldErrors);
  };

  return { pending, error, errors, run, reject };
}

function Form({
  onSubmit,
  error,
  pending,
  submitLabel,
  danger,
  onClose,
  children,
}: {
  onSubmit: (e: FormEvent) => void;
  error?: string;
  pending: boolean;
  submitLabel: string;
  danger?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {children}
      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-3.5 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className={btn.ghost} onClick={onClose} disabled={pending}>
          Cancel
        </button>
        <button type="submit" className={danger ? btn.danger : btn.primary} disabled={pending}>
          {pending ? "Please wait…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function CategorySelect({
  categories,
  value,
  onChange,
  only,
}: {
  categories: Category[];
  value: string;
  onChange: (v: string) => void;
  only?: "MONTHLY";
}) {
  const list = categories.filter((c) => c.isActive && (!only || c.type === only));
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      <option value="">Select category</option>
      {list.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
          {c.amount ? ` · ${fmtMoney(c.amount)}` : ""}
        </option>
      ))}
    </select>
  );
}

const optInt = (v: string) => (v.trim() === "" ? undefined : Number(v));

// ─────────────────────────────────────────────────────────────
// Record payment — from a due (pre-filled) or from the toolbar
// ─────────────────────────────────────────────────────────────
export function RecordPaymentDialog({
  due,
  categories,
  onClose,
}: {
  due?: Due;
  categories: Category[];
  onClose: () => void;
}) {
  const { pending, error, errors, run } = useSubmit(onClose);
  const remaining = due ? Math.max(0, due.amount - due.paidAmount) : 0;

  const [userId, setUserId] = useState<string | undefined>();
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState(due ? String(remaining) : "");
  const [paidAt, setPaidAt] = useState(todayDhaka());
  const [note, setNote] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(() =>
      recordFeePayment({
        dueId: due?.id,
        userId: due ? undefined : userId,
        categoryId: due ? undefined : categoryId || undefined,
        amount: Number(amount),
        // omitted → backend uses "now"
        paidAt: paidAt && paidAt !== todayDhaka() ? dayStart(paidAt) : undefined,
        note: note.trim() || undefined,
      })
    );
  };

  return (
    <Modal title="Record payment" onClose={onClose}>
      <Form onSubmit={submit} error={error} pending={pending} submitLabel="Record payment" onClose={onClose}>
        {due ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm">
            <p className="font-medium text-white">{due.user.name ?? "—"}</p>
            <p className="text-xs text-slate-400">
              {due.title ?? due.category.name} · {fmtMoney(remaining)} remaining
            </p>
          </div>
        ) : (
          <>
            <Field label="Member" error={errors.userId ?? errors.dueId}>
              <MemberPicker value={userId} onChange={setUserId} />
            </Field>
            <Field label="Category" error={errors.categoryId}>
              <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} />
            </Field>
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (৳)" error={errors.amount}>
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Paid on" error={errors.paidAt}>
            <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Note" hint="Optional" error={errors.note}>
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
        </Field>
      </Form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Generate monthly dues
// ─────────────────────────────────────────────────────────────
export function GenerateMonthlyDialog({
  categories,
  onClose,
}: {
  categories: Category[];
  onClose: () => void;
}) {
  const now = new Date();
  const { pending, error, errors, run } = useSubmit(onClose);
  const [categoryId, setCategoryId] = useState("");
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [dueDate, setDueDate] = useState("");
  const [group, setGroup] = useState("");
  const [semester, setSemester] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(() =>
      generateMonthlyDues({
        categoryId,
        month: Number(month),
        year: Number(year),
        dueDate: dueDate ? dayStart(dueDate) : undefined,
        group: group.trim() || undefined,
        semester: optInt(semester),
      })
    );
  };

  return (
    <Modal title="Generate monthly dues" onClose={onClose}>
      <Form onSubmit={submit} error={error} pending={pending} submitLabel="Generate" onClose={onClose}>
        <Field label="Category" error={errors.categoryId}>
          <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} only="MONTHLY" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Month" error={errors.month}>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className={inputCls}>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Year" error={errors.year}>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Due date" hint="Optional" error={errors.dueDate}>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Group" hint="Optional — limit to a group">
            <input value={group} onChange={(e) => setGroup(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Semester" hint="Optional">
            <input
              type="number"
              min={1}
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      </Form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Create dues — one member, a group/semester, or everyone
// ─────────────────────────────────────────────────────────────
type Target = "member" | "group" | "all";

export function CreateDuesDialog({
  categories,
  onClose,
}: {
  categories: Category[];
  onClose: () => void;
}) {
  const { pending, error, errors, run, reject } = useSubmit(onClose);
  const [target, setTarget] = useState<Target>("member");
  const [userId, setUserId] = useState<string | undefined>();
  const [group, setGroup] = useState("");
  const [semester, setSemester] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  const selected = categories.find((c) => c.id === categoryId);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (target === "member" && !userId) return reject("Select a member", { userIds: "Select a member" });
    if (target === "group" && !group.trim() && !semester.trim()) {
      return reject("Enter a group or a semester", { group: "Enter a group or a semester" });
    }
    run(() =>
      createFeeDues({
        categoryId,
        title: title.trim() || undefined,
        amount: optInt(amount),
        dueDate: dueDate ? dayStart(dueDate) : undefined,
        note: note.trim() || undefined,
        userIds: target === "member" && userId ? [userId] : undefined,
        group: target === "group" ? group.trim() || undefined : undefined,
        semester: target === "group" ? optInt(semester) : undefined,
      })
    );
  };

  const tabs: { key: Target; label: string }[] = [
    { key: "member", label: "One member" },
    { key: "group", label: "Group / semester" },
    { key: "all", label: "Everyone" },
  ];

  return (
    <Modal title="Create dues" onClose={onClose}>
      <Form onSubmit={submit} error={error} pending={pending} submitLabel="Create dues" onClose={onClose}>
        <div className="inline-flex w-full gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTarget(t.key)}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                target === t.key
                  ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/25"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {target === "member" && (
          <Field label="Member" error={errors.userIds}>
            <MemberPicker value={userId} onChange={setUserId} />
          </Field>
        )}
        {target === "group" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Group" error={errors.group}>
              <input value={group} onChange={(e) => setGroup(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Semester" error={errors.semester}>
              <input
                type="number"
                min={1}
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        )}

        <Field label="Category" error={errors.categoryId}>
          <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} />
        </Field>
        <Field label="Title" hint="Optional — shown instead of the category name" error={errors.title}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Amount (৳)"
            hint={selected?.amount ? `Default ${fmtMoney(selected.amount)}` : "Optional"}
            error={errors.amount}
          >
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Due date" hint="Optional" error={errors.dueDate}>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Note" hint="Optional" error={errors.note}>
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
        </Field>
      </Form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Category — create / edit (type can't change after creation)
// ─────────────────────────────────────────────────────────────
export function CategoryDialog({
  category,
  onClose,
}: {
  category?: Category;
  onClose: () => void;
}) {
  const editing = !!category;
  const { pending, error, errors, run } = useSubmit(onClose);
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [type, setType] = useState<"MONTHLY" | "ONE_TIME">(category?.type ?? "MONTHLY");
  const [amount, setAmount] = useState(category?.amount ? String(category.amount) : "");
  const [isActive, setIsActive] = useState(category?.isActive ?? true);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (category) {
      run(() =>
        updateFeeCategory(category.id, {
          name: name.trim(),
          description: description.trim() || null,
          amount: optInt(amount) ?? 0,
          isActive,
        })
      );
    } else {
      run(() =>
        createFeeCategory({
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          amount: optInt(amount),
        })
      );
    }
  };

  return (
    <Modal title={editing ? "Edit category" : "New category"} onClose={onClose}>
      <Form
        onSubmit={submit}
        error={error}
        pending={pending}
        submitLabel={editing ? "Save changes" : "Create category"}
        onClose={onClose}
      >
        <Field label="Name" error={errors.name}>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Description" hint="Optional" error={errors.description}>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type" hint={editing ? "Can’t be changed" : undefined}>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "MONTHLY" | "ONE_TIME")}
              disabled={editing}
              className={inputCls}
            >
              <option value="MONTHLY">Monthly</option>
              <option value="ONE_TIME">One time</option>
            </select>
          </Field>
          <Field label="Default amount (৳)" hint="Optional" error={errors.amount}>
            <input
              type="number"
              min={0}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        {editing && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-emerald-400"
            />
            Active
          </label>
        )}
      </Form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Waive due
// ─────────────────────────────────────────────────────────────
export function WaiveDialog({ due, onClose }: { due: Due; onClose: () => void }) {
  const { pending, error, run } = useSubmit(onClose);
  const [note, setNote] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(() => waiveFeeDue(due.id, note.trim() || undefined));
  };

  return (
    <Modal title="Waive due" onClose={onClose}>
      <Form onSubmit={submit} error={error} pending={pending} submitLabel="Waive due" onClose={onClose}>
        <p className="text-sm text-slate-300">
          Waive <span className="font-medium text-white">{fmtMoney(due.amount - due.paidAmount)}</span> for{" "}
          <span className="font-medium text-white">{due.user.name ?? "this member"}</span> (
          {due.title ?? due.category.name}).
        </p>
        <Field label="Note" hint="Optional">
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
        </Field>
      </Form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Delete due
// ─────────────────────────────────────────────────────────────
export function DeleteDueDialog({ due, onClose }: { due: Due; onClose: () => void }) {
  const { pending, error, run } = useSubmit(onClose);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(() => deleteFeeDue(due.id));
  };

  return (
    <Modal title="Delete due" onClose={onClose}>
      <Form onSubmit={submit} error={error} pending={pending} submitLabel="Delete" danger onClose={onClose}>
        <p className="text-sm text-slate-300">
          Delete the <span className="font-medium text-white">{due.title ?? due.category.name}</span> due of{" "}
          <span className="font-medium text-white">{fmtMoney(due.amount)}</span> for{" "}
          <span className="font-medium text-white">{due.user.name ?? "this member"}</span>? This can’t be undone.
        </p>
      </Form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Void payment
// ─────────────────────────────────────────────────────────────
export function VoidPaymentDialog({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const { pending, error, errors, run } = useSubmit(onClose);
  const [reason, setReason] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(() => voidFeePayment(payment.id, reason));
  };

  return (
    <Modal title="Void payment" onClose={onClose}>
      <Form onSubmit={submit} error={error} pending={pending} submitLabel="Void payment" danger onClose={onClose}>
        <p className="text-sm text-slate-300">
          Void receipt <span className="font-medium text-white">{payment.receipt}</span> of{" "}
          <span className="font-medium text-white">{fmtMoney(payment.amount)}</span> from{" "}
          <span className="font-medium text-white">{payment.user.name ?? "this member"}</span>?
        </p>
        <Field label="Reason" error={errors.reason}>
          <input value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} />
        </Field>
      </Form>
    </Modal>
  );
}