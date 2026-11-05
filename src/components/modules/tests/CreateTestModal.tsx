/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createTest } from "@/service/test/test.service";

interface Props {
  projects: any[];
  sectors: any[];
  members?: { id: string; name: string; email?: string }[];
  onClose: () => void;
}

type Opt = { text: string; isCorrect: boolean };
type Question = {
  id: string;
  text: string;
  marks: string;
  explanation: string;
  multiple: boolean;
  options: Opt[];
};

const newQuestion = (): Question => ({
  id: crypto.randomUUID(),
  text: "",
  marks: "1",
  explanation: "",
  multiple: false,
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
});

const TARGETS = [
  { value: "ALL_MEMBERS", label: "All members" },
  { value: "PROJECT_MEMBERS", label: "Project members" },
  { value: "SECTOR_MEMBERS", label: "Sector members" },
  { value: "SPECIFIC_GROUPS", label: "Specific groups" },
  { value: "SPECIFIC_MEMBERS", label: "Specific members" },
];

const input =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const label =
  "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

export default function CreateTestModal({
  projects,
  sectors,
  members = [],
  onClose,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [passing, setPassing] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [shuffle, setShuffle] = useState("true");
  const [showResult, setShowResult] = useState("true");

  const [targetType, setTargetType] = useState("ALL_MEMBERS");
  const [projectId, setProjectId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [groups, setGroups] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [memberIdsText, setMemberIdsText] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  const [questions, setQuestions] = useState<Question[]>(() => [newQuestion()]);

  const totalMarks = useMemo(
    () =>
      questions.reduce((s, q) => s + (Number(q.marks) > 0 ? Number(q.marks) : 1), 0),
    [questions]
  );

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
    );
  }, [members, memberSearch]);

  // ── question helpers ──
  const patchQ = (id: string, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const patchOpt = (qid: string, i: number, patch: Partial<Opt>) =>
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qid
          ? {
              ...q,
              options: q.options.map((o, idx) =>
                idx === i ? { ...o, ...patch } : o
              ),
            }
          : q
      )
    );

  const setCorrect = (q: Question, i: number) => {
    if (q.multiple) {
      patchOpt(q.id, i, { isCorrect: !q.options[i].isCorrect });
    } else {
      patchQ(q.id, {
        options: q.options.map((o, idx) => ({ ...o, isCorrect: idx === i })),
      });
    }
  };

  const toggleMultiple = (q: Question) => {
    const multiple = !q.multiple;
    patchQ(q.id, {
      multiple,
      options: multiple
        ? q.options
        : q.options.map((o, idx) => ({
            ...o,
            isCorrect: idx === q.options.findIndex((x) => x.isCorrect),
          })),
    });
  };

  const addOption = (qid: string) =>
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qid && q.options.length < 8
          ? { ...q, options: [...q.options, { text: "", isCorrect: false }] }
          : q
      )
    );

  const removeOption = (qid: string, i: number) =>
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qid && q.options.length > 2
          ? { ...q, options: q.options.filter((_, idx) => idx !== i) }
          : q
      )
    );

  const toggleMember = (id: string) =>
    setMemberIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );

  // ── submit ──
  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return toast.error("Title is required");
    if (passing && Number(passing) > totalMarks)
      return toast.error(`Passing marks cannot exceed total (${totalMarks})`);
    if (startAt && endAt && new Date(endAt) <= new Date(startAt))
      return toast.error("End time must be after start time");

    for (const [i, q] of questions.entries()) {
      const n = i + 1;
      if (!q.text.trim()) return toast.error(`Question ${n}: text is required`);
      if (q.options.some((o) => !o.text.trim()))
        return toast.error(`Question ${n}: fill in or remove empty options`);
      if (!q.options.some((o) => o.isCorrect))
        return toast.error(`Question ${n}: mark a correct answer`);
    }

    const idsFromText = memberIdsText
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const finalMemberIds = members.length > 0 ? memberIds : idsFromText;
    const groupList = groups
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);

    if (targetType === "PROJECT_MEMBERS" && !projectId)
      return toast.error("Select a project");
    if (targetType === "SECTOR_MEMBERS" && !sectorId)
      return toast.error("Select a sector");
    if (targetType === "SPECIFIC_GROUPS" && groupList.length === 0)
      return toast.error("Enter at least one group");
    if (targetType === "SPECIFIC_MEMBERS" && finalMemberIds.length === 0)
      return toast.error("Select at least one member");

    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("description", description);
    if (duration) fd.set("durationMinutes", duration);
    if (passing) fd.set("passingMarks", passing);
    // convert from the browser's local time to ISO
    if (startAt) fd.set("startAt", new Date(startAt).toISOString());
    if (endAt) fd.set("endAt", new Date(endAt).toISOString());
    fd.set("shuffleQuestions", shuffle);
    fd.set("showResultImmediately", showResult);
    fd.set("targetType", targetType);
    if (targetType === "PROJECT_MEMBERS") fd.set("projectId", projectId);
    if (targetType === "SECTOR_MEMBERS") fd.set("sectorId", sectorId);
    fd.set("groups", JSON.stringify(groupList));
    fd.set("memberIds", JSON.stringify(finalMemberIds));
    fd.set(
      "questions",
      JSON.stringify(
        questions.map((q) => ({
          questionText: q.text.trim(),
          // verify MULTIPLE_CHOICE exists in your QuestionType enum
          type: q.multiple ? "MULTIPLE_CHOICE" : "SINGLE_CHOICE",
          marks: Number(q.marks) > 0 ? Number(q.marks) : 1,
          explanation: q.explanation.trim() || undefined,
          options: q.options.map((o) => ({
            optionText: o.text.trim(),
            isCorrect: o.isCorrect,
          })),
        }))
      )
    );

    startTransition(async () => {
      const res = await createTest(null, fd);
      if (res.success) {
        toast.success(res.message || "Test created");
        router.refresh();
        onClose();
      } else {
        toast.error(res.message || "Failed to create test");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={() => !isPending && onClose()}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-primary to-accent" />
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="text-lg font-semibold">Create Test</h2>
            <p className="text-xs text-muted-foreground">
              {questions.length} question{questions.length !== 1 && "s"} ·{" "}
              {totalMarks} total marks · saved as draft
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-6 overflow-y-auto p-5">
          {/* Basics */}
          <section className="space-y-4">
            <div className="space-y-1.5">
              <label className={label}>Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Test title"
                className={input}
              />
            </div>
            <div className="space-y-1.5">
              <label className={label}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className={input}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <label className={label}>Duration (min)</label>
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="30"
                  className={input}
                />
              </div>
              <div className="space-y-1.5">
                <label className={label}>Total marks</label>
                <input value={totalMarks} readOnly className={`${input} opacity-70`} />
              </div>
              <div className="space-y-1.5">
                <label className={label}>Passing marks</label>
                <input
                  type="number"
                  min={0}
                  max={totalMarks}
                  value={passing}
                  onChange={(e) => setPassing(e.target.value)}
                  className={input}
                />
              </div>
              <div className="space-y-1.5">
                <label className={label}>Shuffle questions</label>
                <select
                  value={shuffle}
                  onChange={(e) => setShuffle(e.target.value)}
                  className={input}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className={label}>Starts at</label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className={input}
                />
              </div>
              <div className="space-y-1.5">
                <label className={label}>Ends at</label>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className={input}
                />
              </div>
              <div className="space-y-1.5">
                <label className={label}>Show result</label>
                <select
                  value={showResult}
                  onChange={(e) => setShowResult(e.target.value)}
                  className={input}
                >
                  <option value="true">Immediately</option>
                  <option value="false">After review</option>
                </select>
              </div>
            </div>
          </section>

          {/* Audience */}
          <section className="space-y-3 rounded-xl border border-border p-4">
            <div className="space-y-1.5">
              <label className={label}>Assign to</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className={input}
              >
                {TARGETS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {targetType === "PROJECT_MEMBERS" && (
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className={input}
              >
                <option value="">Select project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            )}

            {targetType === "SECTOR_MEMBERS" && (
              <select
                value={sectorId}
                onChange={(e) => setSectorId(e.target.value)}
                className={input}
              >
                <option value="">Select sector...</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}

            {targetType === "SPECIFIC_GROUPS" && (
              <input
                value={groups}
                onChange={(e) => setGroups(e.target.value)}
                placeholder="Group names, comma separated"
                className={input}
              />
            )}

            {targetType === "SPECIFIC_MEMBERS" &&
              (members.length > 0 ? (
                <div className="space-y-2">
                  <input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members..."
                    className={input}
                  />
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                    {filteredMembers.map((m) => (
                      <label
                        key={m.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          checked={memberIds.includes(m.id)}
                          onChange={() => toggleMember(m.id)}
                        />
                        <span className="truncate">{m.name}</span>
                        {m.email && (
                          <span className="truncate text-xs text-muted-foreground">
                            {m.email}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {memberIds.length} selected
                  </p>
                </div>
              ) : (
                <textarea
                  value={memberIdsText}
                  onChange={(e) => setMemberIdsText(e.target.value)}
                  rows={2}
                  placeholder="Member IDs, comma or line separated"
                  className={input}
                />
              ))}
          </section>

          {/* Questions */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Questions</h3>
              <button
                type="button"
                onClick={() => setQuestions((qs) => [...qs, newQuestion()])}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" />
                Add question
              </button>
            </div>

            {questions.map((q, qi) => (
              <div
                key={q.id}
                className="space-y-3 rounded-xl border border-border bg-background p-4"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-2 text-sm font-semibold text-muted-foreground">
                    {qi + 1}.
                  </span>
                  <textarea
                    value={q.text}
                    onChange={(e) => patchQ(q.id, { text: e.target.value })}
                    rows={2}
                    placeholder="Question text"
                    className={input}
                  />
                  <button
                    type="button"
                    disabled={questions.length === 1}
                    onClick={() =>
                      setQuestions((qs) => qs.filter((x) => x.id !== q.id))
                    }
                    className="rounded-lg p-2 text-destructive hover:bg-destructive/10 disabled:opacity-30"
                    aria-label="Remove question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 pl-6 text-xs">
                  <label className="flex items-center gap-2">
                    Marks
                    <input
                      type="number"
                      min={1}
                      value={q.marks}
                      onChange={(e) => patchQ(q.id, { marks: e.target.value })}
                      className="w-16 rounded-lg border border-border bg-card px-2 py-1"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={q.multiple}
                      onChange={() => toggleMultiple(q)}
                    />
                    Multiple correct answers
                  </label>
                </div>

                <div className="space-y-2 pl-6">
                  {q.options.map((o, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type={q.multiple ? "checkbox" : "radio"}
                        name={`correct-${q.id}`}
                        checked={o.isCorrect}
                        onChange={() => setCorrect(q, oi)}
                        title="Mark as correct"
                      />
                      <input
                        value={o.text}
                        onChange={(e) =>
                          patchOpt(q.id, oi, { text: e.target.value })
                        }
                        placeholder={`Option ${oi + 1}`}
                        className={input}
                      />
                      <button
                        type="button"
                        disabled={q.options.length <= 2}
                        onClick={() => removeOption(q.id, oi)}
                        className="rounded-lg p-1.5 hover:bg-muted disabled:opacity-30"
                        aria-label="Remove option"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {q.options.length < 8 && (
                    <button
                      type="button"
                      onClick={() => addOption(q.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      + Add option
                    </button>
                  )}
                </div>

                <input
                  value={q.explanation}
                  onChange={(e) => patchQ(q.id, { explanation: e.target.value })}
                  placeholder="Explanation (optional, shown with results)"
                  className={`${input} ml-6 w-[calc(100%-1.5rem)]`}
                />
              </div>
            ))}
          </section>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60 glow-primary"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}