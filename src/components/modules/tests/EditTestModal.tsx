/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPaste, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { updateTest } from "@/service/test/test.service";
import { parseQuestions } from "@/lib/parse-questions";

type Opt = { text: string; isCorrect: boolean };
type Question = {
  id: string;
  text: string;
  marks: string;
  explanation: string;
  multiple: boolean;
  options: Opt[];
};

const input =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const label =
  "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

const BULK_PLACEHOLDER = `1. প্রশ্ন এখানে লিখুন?
ক) অপশন ১  খ) অপশন ২  গ) অপশন ৩  ঘ) অপশন ৪
উত্তর: খ
ব্যাখ্যা: কেন খ সঠিক

2. Next question...
A) Option 1
B) Option 2
Answer: A, B`;

// ISO -> value for <input type="datetime-local"> in the browser's timezone
const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
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

// API question -> editor question
const fromApi = (q: any): Question => ({
  id: q.id ?? crypto.randomUUID(),
  text: q.questionText ?? "",
  marks: String(q.marks ?? 1),
  explanation: q.explanation ?? "",
  multiple: q.type === "MULTIPLE_CHOICE",
  options: (q.options ?? []).map((o: any) => ({
    text: o.optionText ?? "",
    isCorrect: !!o.isCorrect,
  })),
});

export default function EditTestModal({
  test,
  onClose,
}: {
  test: any;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState<string>(test.title || "");
  const [description, setDescription] = useState<string>(test.description || "");
  const [duration, setDuration] = useState<string>(
    test.durationMinutes != null ? String(test.durationMinutes) : ""
  );
  const [passing, setPassing] = useState<string>(
    test.passingMarks != null ? String(test.passingMarks) : ""
  );
  const [startAt, setStartAt] = useState(toLocalInput(test.startAt));
  const [endAt, setEndAt] = useState(toLocalInput(test.endAt));
  const [shuffle, setShuffle] = useState(String(test.shuffleQuestions ?? true));
  const [showResult, setShowResult] = useState(
    String(test.showResultImmediately ?? true)
  );
  const [status, setStatus] = useState<string>(test.status || "DRAFT");

  // ── questions ──
  // Questions can only be changed while the test is still a draft.
  const canEditQuestions = test.status === "DRAFT";
  const [questions, setQuestions] = useState<Question[]>(() =>
    Array.isArray(test.questions) && test.questions.length > 0
      ? [...test.questions]
          .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
          .map(fromApi)
      : []
  );
  const [questionsDirty, setQuestionsDirty] = useState(false);

  // ── bulk paste ──
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkMarks, setBulkMarks] = useState("1");
  const [bulkMode, setBulkMode] = useState<"append" | "replace">("append");

  const parsed = useMemo(() => parseQuestions(bulkText), [bulkText]);
  const missingAnswers = useMemo(
    () =>
      parsed
        .map((p, i) => (p.warning ? i + 1 : null))
        .filter((n): n is number => n !== null),
    [parsed]
  );

  const totalMarks = useMemo(() => {
    if (!questionsDirty) return test.totalMarks ?? 0;
    return questions.reduce(
      (s, q) => s + (Number(q.marks) > 0 ? Number(q.marks) : 1),
      0
    );
  }, [questions, questionsDirty, test.totalMarks]);

  // ── helpers (every change marks questions as dirty) ──
  const change = (fn: (qs: Question[]) => Question[]) => {
    setQuestions(fn);
    setQuestionsDirty(true);
  };

  const patchQ = (id: string, patch: Partial<Question>) =>
    change((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const patchOpt = (qid: string, i: number, patch: Partial<Opt>) =>
    change((qs) =>
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
    change((qs) =>
      qs.map((q) =>
        q.id === qid && q.options.length < 8
          ? { ...q, options: [...q.options, { text: "", isCorrect: false }] }
          : q
      )
    );

  const removeOption = (qid: string, i: number) =>
    change((qs) =>
      qs.map((q) =>
        q.id === qid && q.options.length > 2
          ? { ...q, options: q.options.filter((_, idx) => idx !== i) }
          : q
      )
    );

  const importBulk = () => {
    if (!parsed.length)
      return toast.error("No questions found in the pasted text");

    const added: Question[] = parsed.map((p) => ({
      id: crypto.randomUUID(),
      text: p.text,
      marks: bulkMarks,
      explanation: p.explanation,
      multiple: p.multiple,
      options: p.options,
    }));

    change((qs) => (bulkMode === "replace" ? added : [...qs, ...added]));
    setBulkText("");
    setBulkOpen(false);
    toast.success(
      `${added.length} questions ${bulkMode === "replace" ? "replaced all" : "added"}`
    );
  };

  // ── submit ──
  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return toast.error("Title is required");
    if (passing && Number(passing) > totalMarks)
      return toast.error(`Passing marks cannot exceed total (${totalMarks})`);
    if (startAt && endAt && new Date(endAt) <= new Date(startAt))
      return toast.error("End time must be after start time");

    if (questionsDirty) {
      if (questions.length === 0)
        return toast.error("A test needs at least one question");
      for (const [i, q] of questions.entries()) {
        const n = i + 1;
        if (!q.text.trim()) return toast.error(`Question ${n}: text is required`);
        if (q.options.some((o) => !o.text.trim()))
          return toast.error(`Question ${n}: fill in or remove empty options`);
        if (!q.options.some((o) => o.isCorrect))
          return toast.error(`Question ${n}: mark a correct answer`);
      }
    }

    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("description", description);
    if (duration) fd.set("durationMinutes", duration);
    if (passing) fd.set("passingMarks", passing);
    if (startAt) fd.set("startAt", new Date(startAt).toISOString());
    if (endAt) fd.set("endAt", new Date(endAt).toISOString());
    fd.set("shuffleQuestions", shuffle);
    fd.set("showResultImmediately", showResult);
    fd.set("status", status);

    // only send questions when they were actually changed
    if (questionsDirty) {
      fd.set(
        "questions",
        JSON.stringify(
          questions.map((q) => ({
            questionText: q.text.trim(),
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
    }

    startTransition(async () => {
      const res = await updateTest(test.id, null, fd);
      if (res.success) {
        toast.success(res.message || "Test updated");
        router.refresh();
        onClose();
      } else {
        toast.error(res.message || "Failed to update test");
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
            <h2 className="text-lg font-semibold">Edit Test</h2>
            <p className="text-xs text-muted-foreground">
              {questions.length} question{questions.length !== 1 && "s"} ·{" "}
              {totalMarks} total marks
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted"
          >
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
                  className={input}
                />
              </div>
              <div className="space-y-1.5">
                <label className={label}>Total marks</label>
                <input
                  value={totalMarks}
                  readOnly
                  className={`${input} opacity-70`}
                />
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
                <label className={label}>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={input}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="CLOSED">Closed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
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
                <label className={label}>Shuffle</label>
                <select
                  value={shuffle}
                  onChange={(e) => setShuffle(e.target.value)}
                  className={input}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
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

          {/* Questions */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Questions</h3>
              {canEditQuestions && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  >
                    <ClipboardPaste className="h-3.5 w-3.5" />
                    Bulk paste
                  </button>
                  <button
                    type="button"
                    onClick={() => change((qs) => [...qs, newQuestion()])}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add question
                  </button>
                </div>
              )}
            </div>

            {!canEditQuestions && (
              <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                Questions are locked because this test is no longer a draft.
                Set it back to Draft (and save) to edit them.
              </p>
            )}

            {canEditQuestions && bulkOpen && (
              <div className="space-y-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={10}
                  placeholder={BULK_PLACEHOLDER}
                  className={`${input} font-mono`}
                />
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {parsed.length} question{parsed.length !== 1 && "s"}{" "}
                      detected
                    </p>
                    {missingAnswers.length > 0 && (
                      <p className="text-destructive">
                        No answer found in: {missingAnswers.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={bulkMode}
                      onChange={(e) =>
                        setBulkMode(e.target.value as "append" | "replace")
                      }
                      className="rounded-lg border border-border bg-card px-2 py-1"
                    >
                      <option value="append">Add to existing</option>
                      <option value="replace">Replace all</option>
                    </select>
                    <label className="flex items-center gap-2">
                      Marks each
                      <input
                        type="number"
                        min={1}
                        value={bulkMarks}
                        onChange={(e) => setBulkMarks(e.target.value)}
                        className="w-16 rounded-lg border border-border bg-card px-2 py-1"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={importBulk}
                      disabled={!parsed.length}
                      className="rounded-lg bg-primary px-4 py-1.5 font-medium text-primary-foreground disabled:opacity-50"
                    >
                      Import {parsed.length || ""}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                    disabled={!canEditQuestions}
                    onChange={(e) => patchQ(q.id, { text: e.target.value })}
                    rows={2}
                    placeholder="Question text"
                    className={input}
                  />
                  {canEditQuestions && (
                    <button
                      type="button"
                      onClick={() =>
                        change((qs) => qs.filter((x) => x.id !== q.id))
                      }
                      className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                      aria-label="Remove question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 pl-6 text-xs">
                  <label className="flex items-center gap-2">
                    Marks
                    <input
                      type="number"
                      min={1}
                      value={q.marks}
                      disabled={!canEditQuestions}
                      onChange={(e) => patchQ(q.id, { marks: e.target.value })}
                      className="w-16 rounded-lg border border-border bg-card px-2 py-1"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={q.multiple}
                      disabled={!canEditQuestions}
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
                        disabled={!canEditQuestions}
                        onChange={() => setCorrect(q, oi)}
                        title="Mark as correct"
                      />
                      <input
                        value={o.text}
                        disabled={!canEditQuestions}
                        onChange={(e) =>
                          patchOpt(q.id, oi, { text: e.target.value })
                        }
                        placeholder={`Option ${oi + 1}`}
                        className={input}
                      />
                      {canEditQuestions && (
                        <button
                          type="button"
                          disabled={q.options.length <= 2}
                          onClick={() => removeOption(q.id, oi)}
                          className="rounded-lg p-1.5 hover:bg-muted disabled:opacity-30"
                          aria-label="Remove option"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {canEditQuestions && q.options.length < 8 && (
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
                  disabled={!canEditQuestions}
                  onChange={(e) =>
                    patchQ(q.id, { explanation: e.target.value })
                  }
                  placeholder="Explanation (optional, shown with results)"
                  className={`${input} ml-6 w-[calc(100%-1.5rem)]`}
                />
              </div>
            ))}

            {questions.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                No questions loaded. Use Bulk paste or Add question.
              </p>
            )}
          </section>

          <p className="text-xs text-muted-foreground">
            Assignments (who the test is for) can&apos;t be edited after
            creation.
          </p>

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
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}